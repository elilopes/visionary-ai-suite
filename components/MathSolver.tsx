
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';
import ImageInput from './ImageInput';

interface MathSolverProps {
    labels: any;
}

const MathSolver: React.FC<MathSolverProps> = ({ labels }) => {
    const [equation, setEquation] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'local' | 'ai'>('local');
    const printRef = useRef<HTMLDivElement>(null);

    const safeLabels = {
        mathSolverTitle: labels.mathSolverTitle || "Resolução Matemática",
        mathSolverDescription: labels.mathSolverDescription || "Resolva equações com IA ou localmente.",
        mathSolverModeLocal: labels.mathSolverModeLocal || "Local",
        mathSolverModeAI: labels.mathSolverModeAI || "IA Tutor",
        mathSolverInputLabel: labels.mathSolverInputLabel || "Problema",
        mathSolverPlaceholder: labels.mathSolverPlaceholder || "Ex: 2x + 5 = 15",
        mathSolverImageLabel: labels.mathSolverImageLabel || "Upload de Foto",
        mathSolverButtonLoading: labels.mathSolverButtonLoading || "Resolvendo...",
        mathSolverButton: labels.mathSolverButton || "Resolver com IA",
        mathSolverLocalButton: labels.mathSolverLocalButton || "Resolver Local",
        resultTitle: labels.resultTitle || "Resultado",
        error: labels.error || "Ocorreu um erro."
    };

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const solveLocally = (expr: string) => {
        try {
            const cleaned = expr.replace(/\s/g, '').replace(/,/g, '.');
            if (!cleaned.includes('x') && !cleaned.includes('=')) {
                // eslint-disable-next-line no-new-func
                const calc = Function(`'use strict'; return (${cleaned})`)();
                return `**Cálculo Local Rápido:**\n### O resultado é: **${calc}**\n\n*Nota: Cálculos locais são processados no seu dispositivo.*`;
            }
            const eqMatch = cleaned.match(/(-?\d*)x([+-]\d+)?=(-?\d+)/);
            if (eqMatch) {
                let a = eqMatch[1] === "" ? 1 : (eqMatch[1] === "-" ? -1 : parseFloat(eqMatch[1]));
                let b = eqMatch[2] ? parseFloat(eqMatch[2]) : 0;
                let c = parseFloat(eqMatch[3]);
                const x = (c - b) / a;
                return `**Resolução Linear (Local):**\n### x = **${x}**\n\nPassos:\n1. Isolar x: ${a}x = ${c} - (${b})\n2. Dividir: x = ${c - b} / ${a}`;
            }
            return "Use o **Modo IA Tutor** para problemas complexos.";
        } catch (e) {
            return "Erro no Modo Local.";
        }
    };

    const handleSolve = async () => {
        if (!equation.trim() && !file) return;
        setError('');
        setResult('');
        if (mode === 'local' && !file) {
            setResult(solveLocally(equation));
            return;
        }
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Aja como um Tutor Matemático de alto nível. Resolva o problema fornecido passo a passo. Use LaTeX para fórmulas se necessário. Responda em Português. Problema: ${equation}`;
            let response;
            if (file) {
                const filePart = await fileToGenerativePart(file);
                response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: { parts: [filePart, { text: prompt }] }
                });
            } else {
                response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                });
            }
            setResult(response.text || 'Nenhuma solução encontrada.');
        } catch (e) {
            setError(safeLabels.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-[var(--bg-panel)] p-6 rounded-lg shadow-lg border border-[var(--border-main)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-[var(--accent)]">{safeLabels.mathSolverTitle}</h3>
                    <p className="text-[var(--text-muted)] text-sm">{safeLabels.mathSolverDescription}</p>
                </div>
                <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border-main)]">
                    <button onClick={() => setMode('local')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'local' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'}`}>{safeLabels.mathSolverModeLocal}</button>
                    <button onClick={() => setMode('ai')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'ai' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'}`}>{safeLabels.mathSolverModeAI}</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <TextArea id="math-input" label={safeLabels.mathSolverInputLabel} value={equation} placeholder={safeLabels.mathSolverPlaceholder} onChange={setEquation} />
                    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border-main)]">
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-3">{safeLabels.mathSolverImageLabel}</label>
                        <ImageInput onChange={(f) => { setFile(f); if(mode==='local') setMode('ai'); }} labels={labels} />
                    </div>
                    <button onClick={handleSolve} disabled={isLoading || (!equation.trim() && !file)} className="w-full flex items-center justify-center px-6 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-md disabled:opacity-50 transition-all">
                        {isLoading ? <Spinner /> : null}
                        {isLoading ? safeLabels.mathSolverButtonLoading : (mode === 'ai' ? safeLabels.mathSolverButton : safeLabels.mathSolverLocalButton)}
                    </button>
                </div>
                <div className="bg-[var(--bg-input)] p-6 rounded-lg border border-[var(--border-main)] min-h-[350px] flex flex-col">
                    <h4 className="text-lg font-semibold text-[var(--text-main)] mb-4 border-b border-[var(--border-main)] pb-2">{safeLabels.resultTitle}</h4>
                    <div className="flex-grow overflow-auto custom-scrollbar">
                        {error && <div className="text-red-400">{error}</div>}
                        {result && <div className="text-[var(--text-main)] prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />}
                        {!result && !isLoading && <div className="text-[var(--text-muted)] italic">Aguardando entrada...</div>}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MathSolver;
