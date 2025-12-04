
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import TextArea from './TextArea';
import Spinner from './Spinner';

interface ResumeGeneratorProps {
    labels: any;
}

const ResumeGenerator: React.FC<ResumeGeneratorProps> = ({ labels }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [experience, setExperience] = useState('');
    const [skills, setSkills] = useState('');
    const [education, setEducation] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!name.trim() || !experience.trim()) return;
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Act as a Professional Resume Writer. Create a polished, high-impact resume based on the following details.
            
            Name: ${name}
            Target Role: ${role}
            Experience Summary: ${experience}
            Skills: ${skills}
            Education: ${education}
            
            IMPORTANT: Output the result as Clean HTML suitable for saving as a .doc file.
            Use standard HTML tags: <h1> for Name, <h2> for Role, <h3> for Section Headers (Summary, Experience, Skills, Education), <p> for paragraphs, <ul>/<li> for lists.
            Add simple inline CSS styles: font-family: Arial, sans-serif; line-height: 1.5; color: #333. 
            Make the Name bold and centered (h1).
            Do NOT wrap in markdown code blocks like \`\`\`html. Just return the raw HTML string starting with <html>.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setResult(response.text || '');
        } catch (e) {
            console.error("Error generating resume:", e);
            setError(labels.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Resume</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + result + footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `Resume_${name.replace(/\s+/g, '_')}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    return (
        <section className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-indigo-500/30">
            <h3 className="text-2xl font-bold mb-2 text-indigo-400">{labels.resumeGeneratorTitle}</h3>
            <p className="text-gray-400 mb-6">{labels.resumeGeneratorDescription}</p>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{labels.resumeGeneratorName}</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{labels.resumeGeneratorRole}</label>
                        <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                    </div>
                </div>

                <TextArea
                    id="resume-experience"
                    label={labels.resumeGeneratorExperience}
                    value={experience}
                    placeholder="e.g. Worked at Company X from 2020-2024 as Senior Dev..."
                    onChange={setExperience}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-400">{labels.resumeGeneratorSkills}</label>
                         <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-400">{labels.resumeGeneratorEducation}</label>
                         <input type="text" value={education} onChange={(e) => setEducation(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-700 text-white rounded-md p-3" />
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !name.trim()}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors w-full"
                >
                    {isLoading ? <Spinner /> : null}
                    {isLoading ? labels.generatingPreview : labels.resumeGeneratorButton}
                </button>
            </div>

            {(result || error) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-200 mb-2">{labels.resultTitle}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {result && (
                        <div>
                            <div className="bg-white text-black p-6 rounded-md mb-4 max-h-96 overflow-y-auto border border-gray-300 shadow-inner" dangerouslySetInnerHTML={{ __html: result }} />
                            <button
                                onClick={handleDownload}
                                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors w-full"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                {labels.downloadDocx}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default ResumeGenerator;
