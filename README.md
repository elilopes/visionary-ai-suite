# Visionary AI Suite

![Visionary AI Suite Banner](https://via.placeholder.com/1200x300?text=Visionary+AI+Suite)

**Visionary AI Suite** is a comprehensive, all-in-one AI workspace designed for creators, developers, marketers, and researchers. It integrates advanced Large Language Models (Google Gemini), Computer Vision (MediaPipe), and Audio Processing tools into a unified, modern web interface.

From generating complex prompts and editing photos with AI to analyzing social media trends and downloading videos, Visionary AI Suite centralizes powerful utilities that usually require multiple subscriptions.

---

## 🚀 Key Features

### 🧠 Prompt Engineering & Text AI
*   **Advanced Prompt Generator:** Create structured prompts with fine-grained control over tone, style, lighting, and camera angles.
*   **Prompt Tuner:** Use AI to refine and optimize your prompts for better results.
*   **Grammar Checker:** Multilingual grammar analysis with detailed explanations.
*   **Text Tools:** Summarizer, Humanizer, Translator, and Article Generator.

### 🎨 Photo Studio & Effects
*   **AI Restoration:** Colorize B&W photos, restore damaged images, and remove objects.
*   **Style Transfer:** Transform photos into 3D renders, Cartoons, Paintings, or Sketches.
*   **Virtual Try-On:** Change hairstyles (Wigs), body shape, or mix-and-match outfits.
*   **Liquify Editor:** Manual warping and distortion tools.
*   **AR Filters:** Real-time face tracking with masks and accessories via Webcam.

### 🎬 Video & Audio Suite
*   **Video Downloader:** Generate scripts (Python/Node) or download videos directly from social platforms.
*   **Vocal Remover:** Isolate instrumentals from songs using browser-based audio processing.
*   **Audio Visualizer:** Real-time 3D frequency visualization from microphone input.
*   **Video Captioner & Transcriber:** Generate SRT subtitles and full text transcripts using AI.
*   **Converter (Wasm):** Convert video formats (MP4, GIF, WEBM) locally using WebAssembly.

### 📊 Social Media & Analytics
*   **Instagram & Facebook Tools:** Analyze posts, generate captions, and track engagement.
*   **Planner:** AI-driven content calendar strategies.
*   **Sentiment Analysis:** Understand the emotional tone of comments and posts.

### 📚 Wiki & Research
*   **Wikidata Extractor:** Convert text into structured data triples.
*   **SPARQL Generator:** Generate complex query code from natural language.
*   **Citation Finder:** Find reliable academic sources for claims.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (Dark/Light/High-Contrast Themes)
*   **AI Core:** Google GenAI SDK (Gemini 2.5 Flash / Pro)
*   **Computer Vision:** MediaPipe (@mediapipe/tasks-vision)
*   **Video Processing:** FFmpeg.wasm, yt-dlp (Backend)
*   **Audio:** Web Audio API
*   **Backend:** Node.js, Express, MySQL (Optional for community features)

---

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18 or higher)
*   NPM or Yarn
*   A Google Gemini API Key ([Get it here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/visionary-ai-suite.git
cd visionary-ai-suite
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Required for AI features
API_KEY=your_google_gemini_api_key_here

# Optional: Backend URL if running the server
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=root
DB_PASS=password
DB_NAME=prompt_generator_db
```

### 4. Start the Application
```bash
npm start
```
The app will run at `http://localhost:3000`.

---

## 🖥️ Running the Backend (Optional)
Some features like direct video downloading and community voting require the backend server.

1.  Navigate to the root directory.
2.  Ensure you have Python and `yt-dlp` installed on your system if you want to use the video downloader.
3.  Run the server:
    ```bash
    node server.js
    ```
    The server runs on port `3001`.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Note:** This application uses the Google Gemini API. Usage costs may apply depending on your API quota tiers.
