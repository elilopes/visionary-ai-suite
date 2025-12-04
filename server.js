/**
 * BACKEND SERVER (Node.js + Express + MySQL)
 * 
 * How to run locally:
 * 1. Install dependencies: npm install express mysql2 cors dotenv body-parser helmet express-rate-limit
 * 2. Ensure MySQL is running.
 * 3. Configure .env file.
 * 4. Install yt-dlp on the system: 
 *    - Linux: sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp
 *    - Windows: choco install yt-dlp
 * 5. Run: node server.js
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Security Packages (Optional fallback if not installed in local dev)
let helmet;
let rateLimit;
try {
    helmet = require('helmet');
    rateLimit = require('express-rate-limit');
} catch (e) {
    console.warn("⚠️ Security packages (helmet, express-rate-limit) not found. Skipping strict security middleware.");
}

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// --- Security Middleware ---

// 1. Helmet: Sets various HTTP headers to secure the app
if (helmet) {
    app.use(helmet());
}

// 2. CORS: Restrict access to trusted domains
// In production, replace '*' with your actual frontend domain (e.g., 'https://myapp.com')
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' })); // Limit body size to prevent DoS

// 3. Rate Limiting: Prevent brute-force and DDoS
if (rateLimit) {
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Muitas requisições deste IP, tente novamente mais tarde.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', apiLimiter);
}

// --- Configuration & Validation ---

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'prompt_generator_db',
    multipleStatements: true
};

function checkEnvironment() {
    console.log('--- Verificando Ambiente ---');
    if (!process.env.DB_USER) console.warn('⚠️ AVISO: DB_USER não definido no .env.');
    // Allow startup without DB pass for dev if needed, but warn
    if (process.env.DB_PASS === undefined) {
        console.warn('⚠️ AVISO: DB_PASS não encontrada no .env. O banco de dados pode falhar.');
    }
    return true;
}

// --- Database Initialization ---

let pool;

async function initializeDatabase() {
    if (!checkEnvironment()) return false;

    console.log('--- Inicializando Banco de Dados ---');
    let connection;
    try {
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            multipleStatements: true
        });

        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await connection.query(schemaSql);
            console.log('✅ Banco de dados configurado.');
        } else {
            console.warn('⚠️ schema.sql não encontrado. Pulando criação de tabelas.');
        }
        await connection.end();

        pool = mysql.createPool({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        return true;
    } catch (error) {
        console.error('❌ Falha na inicialização do DB:', error.message);
        return false;
    }
}

// --- Helper: Input Validation ---
const isValidId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id) && id.length < 50;
const isValidUrl = (url) => {
    try {
        const u = new URL(url);
        return ['http:', 'https:'].includes(u.protocol);
    } catch (_) {
        return false;
    }
};

// --- API Routes ---

// GET all prompts
app.get('/api/prompts', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not available' });
    try {
        const [rows] = await pool.query('SELECT * FROM shared_prompts ORDER BY created_at DESC');
        const formattedRows = rows.map(row => ({
            ...row,
            selections: typeof row.selections === 'string' ? JSON.parse(row.selections) : row.selections,
            votes: { up: row.votes_up, down: row.votes_down },
            isTestedByAuthor: Boolean(row.is_tested_by_author),
            testImageBase64: row.test_image_base64,
            communityTestedCount: row.community_tested_count,
            promptJson: row.prompt_json,
            customText: row.custom_text,
            createdAt: Number(row.created_at)
        }));
        res.json(formattedRows);
    } catch (error) {
        console.error('Erro GET prompts:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST new prompt
app.post('/api/prompts', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not available' });
    const p = req.body;
    
    // SECURITY: Basic validation
    if (!p.author || !p.promptJson || !p.language) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const query = `
            INSERT INTO shared_prompts 
            (id, author, prompt_json, custom_text, selections, is_tested_by_author, test_image_base64, votes_up, votes_down, community_tested_count, language, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const selectionsStr = JSON.stringify(p.selections);
        
        await pool.execute(query, [
            p.id, p.author, p.promptJson, p.customText, selectionsStr, 
            p.isTestedByAuthor, p.testImageBase64, 
            p.votes.up, p.votes.down, p.communityTestedCount, 
            p.language, p.createdAt
        ]);
        
        res.status(201).json({ message: 'Prompt saved successfully' });
    } catch (error) {
        console.error('Erro POST prompt:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST Vote (Up/Down)
app.post('/api/prompts/:id/vote', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not available' });
    const { id } = req.params;
    const { type } = req.body;
    
    if (!isValidId(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    if (!['up', 'down'].includes(type)) {
        return res.status(400).json({ error: 'Invalid vote type' });
    }

    const column = type === 'up' ? 'votes_up' : 'votes_down';

    try {
        await pool.execute(`UPDATE shared_prompts SET ${column} = ${column} + 1 WHERE id = ?`, [id]);
        res.json({ message: 'Vote recorded' });
    } catch (error) {
        console.error('Erro POST vote:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST Mark as tested
app.post('/api/prompts/:id/test', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Database not available' });
    const { id } = req.params;
    
    if (!isValidId(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        await pool.execute('UPDATE shared_prompts SET community_tested_count = community_tested_count + 1 WHERE id = ?', [id]);
        res.json({ message: 'Test count updated' });
    } catch (error) {
        console.error('Erro POST test:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- VIDEO DOWNLOAD PROXY ENDPOINTS ---

// 1. Get Video Info (Metadata)
app.get('/api/video/info', async (req, res) => {
    const { url } = req.query;

    if (!url || !isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid or missing URL' });
    }

    // Using yt-dlp to dump JSON info
    const child = spawn('yt-dlp', ['--dump-json', '--no-playlist', url]);
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp error: ${stderr}`);
            return res.status(500).json({ error: 'Failed to fetch video info. Server may need yt-dlp installed.' });
        }
        try {
            const info = JSON.parse(stdout);
            res.json({
                title: info.title,
                thumbnail: info.thumbnail,
                duration: info.duration_string,
                platform: info.extractor_key,
                formats: info.formats ? info.formats.length : 0
            });
        } catch (e) {
            res.status(500).json({ error: 'Failed to parse video info' });
        }
    });
});

// 2. Download/Stream Video
app.get('/api/video/download', (req, res) => {
    const { url, type } = req.query; // type: 'video' or 'audio'

    if (!url || !isValidUrl(url)) {
        return res.status(400).send('Invalid URL');
    }

    const isAudio = type === 'audio';
    const filename = isAudio ? 'audio.mp3' : 'video.mp4';
    
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.header('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');

    // yt-dlp args
    // -o - : Output to stdout
    // -f : format
    const args = ['-o', '-'];
    if (isAudio) {
        args.push('-x', '--audio-format', 'mp3');
    } else {
        // Get best video (up to 1080p) + best audio, merge to mp4
        args.push('-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    }
    args.push(url);

    const child = spawn('yt-dlp', args);

    child.stdout.pipe(res);

    child.stderr.on('data', (data) => {
        // Log progress/errors to console, don't send to client as they are receiving binary
        console.log(`yt-dlp stderr: ${data}`);
    });

    child.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp process exited with code ${code}`);
            // If headers haven't been sent, we can send error, otherwise stream just ends
            if (!res.headersSent) {
                res.status(500).send('Download failed on server.');
            }
        }
    });

    // Handle client disconnect to kill the spawn process
    req.on('close', () => {
        child.kill();
    });
});


// --- Start Server ---

initializeDatabase().then(() => {
    app.listen(port, () => {
        console.log(`\n🚀 Backend Seguro rodando em: http://localhost:${port}\n`);
    });
});