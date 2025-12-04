
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import Selector from './components/Selector';
import CodeBlock from './components/CodeBlock';
import TextArea from './components/TextArea';
import Spinner from './components/Spinner';
import GrammarCheckModal from './components/GrammarCheckModal';
import ImagePreview from './components/ImagePreview';
import AuthModal from './components/AuthModal';
import ShareModal from './components/ShareModal';
import CommunityFeed from './components/CommunityFeed';
import AiTools from './components/AiTools';
import PhotoTools from './components/PhotoTools';
import MakeupStudio from './components/MakeupStudio';
import VideoTools from './components/VideoTools';
import WikiTools from './components/WikiTools';
import MiniEditor from './components/MiniEditor';
import SocialMediaTools from './components/SocialMediaTools';
import ErrorBoundary from './components/ErrorBoundary';
import HelpModal from './components/HelpModal';
import SiteMapModal from './components/SiteMapModal';
import GoogleAd from './components/GoogleAd';
import { PROMPT_OPTIONS, CATEGORY_LABELS, PROMPT_GROUPS, GROUP_LABELS, CUSTOM_TEXT_LABELS, TUNER_LABELS, QUANTITY_LABELS, SCENE_QUANTITY_LABELS, UI_LABELS, GRAMMAR_CHECK_LABELS, PROMPT_TEMPLATES, AI_TOOLS_LABELS, MAKEUP_TOOLS_LABELS, VIDEO_TOOLS_LABELS, WIKI_TOOLS_LABELS, SOCIAL_TOOLS_LABELS, THEMES } from './constants';
import type { Language, PromptSelections, PromptCategory, GrammarCheckResult, PromptGroupKey, SharedPrompt, Theme } from './types';
import { languageMap } from './types';
import { saveSharedPrompt } from './communityApi';

type AppTab = 'generator' | 'tools' | 'photos' | 'makeup' | 'video' | 'wiki' | 'editor' | 'community' | 'social';

interface TabButtonProps {
  tab: AppTab;
  label: string;
  activeTab: AppTab;
  onClick: (tab: AppTab) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, label, activeTab, onClick }) => (
   <button
      onClick={() => onClick(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 whitespace-nowrap
          ${activeTab === tab 
              ? 'bg-gray-800/50 text-indigo-400 border-b-2 border-indigo-500' 
              : 'text-gray-400 hover:text-white'
          }`}
   >
      {label}
   </button>
);

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  const [selections, setSelections] = useState<PromptSelections>({});
  const [customText, setCustomText] = useState('');
  const [generatedJson, setGeneratedJson] = useState('');
  const [tunedJson, setTunedJson] = useState('');
  const [isTuning, setIsTuning] = useState(false);
  const [tuningError, setTuningError] = useState('');
  const [promptCount, setPromptCount] = useState<number>(1);
  const [sceneCount, setSceneCount] = useState<number>(1);
  const [isGrammarModalOpen, setIsGrammarModalOpen] = useState(false);
  const [grammarCheckResult, setGrammarCheckResult] = useState<GrammarCheckResult | null>(null);
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false);
  const [grammarCheckError, setGrammarCheckError] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(false);
  const [openSections, setOpenSections] = useState<Record<PromptGroupKey, boolean>>({
      coreContext: true, subjectDetails: false, sceneSetup: false, cinematography: false, postProduction: false, outputConstraints: false
  });
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingTestImage, setIsGeneratingTestImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageGenError, setImageGenError] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [shareConfirmation, setShareConfirmation] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('generator');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);

  const isInitialMount = useRef(true);

  // Apply Theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const currentOptions = useMemo(() => PROMPT_OPTIONS[language], [language]);
  const currentCategoryLabels = useMemo(() => CATEGORY_LABELS[language], [language]);
  const currentGroupLabels = useMemo(() => GROUP_LABELS[language], [language]);
  const currentCustomTextLabels = useMemo(() => CUSTOM_TEXT_LABELS[language], [language]);
  const currentTunerLabels = useMemo(() => TUNER_LABELS[language], [language]);
  const currentQuantityLabel = useMemo(() => QUANTITY_LABELS[language], [language]);
  const currentSceneQuantityLabel = useMemo(() => SCENE_QUANTITY_LABELS[language], [language]);
  const currentUiLabels = useMemo(() => UI_LABELS[language], [language]);
  const currentGrammarCheckLabels = useMemo(() => GRAMMAR_CHECK_LABELS[language], [language]);
  const currentTemplates = useMemo(() => PROMPT_TEMPLATES[language], [language]);
  const currentAiToolsLabels = useMemo(() => AI_TOOLS_LABELS[language], [language]);
  const currentMakeupLabels = useMemo(() => MAKEUP_TOOLS_LABELS[language], [language]);
  const currentVideoLabels = useMemo(() => VIDEO_TOOLS_LABELS[language], [language]);
  const currentWikiLabels = useMemo(() => WIKI_TOOLS_LABELS[language], [language]);
  const currentSocialLabels = useMemo(() => SOCIAL_TOOLS_LABELS[language], [language]);

  const initializeSelections = useCallback((defaults = {}) => {
    const initialSelections: PromptSelections = {};
    for (const key in currentOptions) {
      const categoryKey = key as PromptCategory;
      initialSelections[categoryKey] = currentOptions[categoryKey][0];
    }
    setSelections({ ...initialSelections, ...defaults });
  }, [currentOptions]);
  
  const handleClearAll = useCallback(() => {
    initializeSelections();
    setCustomText('');
    setTunedJson('');
    setGeneratedImages([]);
    setImageGenError('');
    setSelectedTemplate('');
  }, [initializeSelections]);
  
  const loadStateFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const promptData = params.get('prompt');
    if (promptData) {
      try {
        const decoded = decodeURIComponent(atob(promptData));
        const { selections: urlSelections, customText: urlCustomText, language: urlLanguage } = JSON.parse(decoded);
        
        const langToSet = (Object.keys(languageMap).includes(urlLanguage) ? urlLanguage : language) as Language;
        setLanguage(langToSet);

        const initialSelections: PromptSelections = {};
        const optionsForLang = PROMPT_OPTIONS[langToSet];
         for (const key in optionsForLang) {
          const categoryKey = key as PromptCategory;
          initialSelections[categoryKey] = optionsForLang[categoryKey][0];
        }

        setSelections({ ...initialSelections, ...urlSelections });
        setCustomText(urlCustomText || '');
        
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      } catch (error) {
        console.error("Failed to parse prompt data from URL:", error);
        return false;
      }
    }
    return false;
  }, [language]);

  useEffect(() => {
    if (isInitialMount.current) {
        if (!loadStateFromUrl()) {
            const mockAuth = localStorage.getItem('prompt-generator-auth') === 'true';
            const driveAuth = localStorage.getItem('prompt-generator-drive') === 'true';
            setIsAuthenticated(mockAuth);
            setIsDriveConnected(driveAuth);

            const savedAutoSave = (localStorage.getItem('prompt-generator-autosave') === 'true') && (mockAuth || driveAuth);
            setAutoSave(savedAutoSave);

            if (savedAutoSave) {
                const savedState = localStorage.getItem(`prompt-generator-state-${language}`);
                if (savedState) {
                    const { selections: savedSelections, customText: savedCustomText, tunedJson: savedTunedJson } = JSON.parse(savedState);
                    initializeSelections(savedSelections);
                    setCustomText(savedCustomText || '');
                    setTunedJson(savedTunedJson || '');
                } else {
                    initializeSelections();
                }
            } else {
                initializeSelections();
            }
        }
        isInitialMount.current = false;
    } else {
        handleClearAll();
        setOpenSections({ coreContext: true, subjectDetails: false, sceneSetup: false, cinematography: false, postProduction: false, outputConstraints: false });
    }
    setTuningError('');
    setIsGrammarModalOpen(false);
    setGrammarCheckResult(null);
    setGrammarCheckError(null);
  }, [language, loadStateFromUrl, handleClearAll, initializeSelections]);

  useEffect(() => {
    if (autoSave && (isAuthenticated || isDriveConnected) && !isInitialMount.current) {
      const location = isDriveConnected ? "Google Drive" : "Cloud";
      console.log(`Simulating: Saving state to ${location}...`);
      const stateToSave = { selections, customText, tunedJson };
      localStorage.setItem(`prompt-generator-state-${language}`, JSON.stringify(stateToSave));
    }
  }, [selections, customText, tunedJson, autoSave, language, isAuthenticated, isDriveConnected]);
  
  useEffect(() => {
    if (isAuthenticated || isDriveConnected) {
        localStorage.setItem('prompt-generator-autosave', String(autoSave));
    } else {
        localStorage.removeItem('prompt-generator-autosave');
    }
  }, [autoSave, isAuthenticated, isDriveConnected]);

  useEffect(() => {
    const filteredSelections = Object.entries(selections)
      .reduce((obj, [key, value]) => {
        if (typeof value === 'string') {
          obj[key as PromptCategory] = value;
        }
        return obj;
      }, {} as PromptSelections);
      
    const finalJsonData: { [key: string]: any } = { ...filteredSelections };
    if (customText.trim()) {
        finalJsonData.custom_prompt = customText.trim();
    }

    setGeneratedJson(JSON.stringify(finalJsonData, null, 2));
  }, [selections, customText]);

  const handleAutoSaveToggle = () => {
    if (!autoSave && !isAuthenticated && !isDriveConnected) {
        setIsAuthModalOpen(true);
    } else {
        setAutoSave(!autoSave);
    }
  };

  const handleLoginSuccess = (method: 'email' | 'drive') => {
    if (method === 'email') {
        setIsAuthenticated(true);
        localStorage.setItem('prompt-generator-auth', 'true');
    } else {
        setIsDriveConnected(true);
        localStorage.setItem('prompt-generator-drive', 'true');
    }
    setAutoSave(true);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setIsDriveConnected(false);
      setAutoSave(false);
      localStorage.removeItem('prompt-generator-auth');
      localStorage.removeItem('prompt-generator-drive');
      localStorage.removeItem('prompt-generator-autosave');
  };

  const getFriendlyErrorMessage = (error: any, defaultMsg: string) => {
      if (!error) return defaultMsg;
      const msg = error.message || error.toString();
      if (msg.includes('403')) return "Access Denied. Please check your API Key permissions.";
      if (msg.includes('401')) return "Invalid API Key. Please check your settings.";
      if (msg.includes('429')) return "Quota Exceeded. Please wait a moment before trying again.";
      if (msg.includes('503')) return "Service Temporarily Unavailable. Please try again later.";
      if (msg.includes('SAFETY') || msg.includes('blocked')) return "Generation blocked by safety filters. Try rephrasing your prompt.";
      if (msg.includes('candidate')) return "The AI could not generate a response for this input. Try simplifying your request.";
      return `${defaultMsg} (${msg.substring(0, 100)}...)`;
  };
  
  const handleGeneratePrompts = async () => {
    setIsTuning(true);
    setTuningError('');
    setTunedJson('');
    setGeneratedImages([]);
    setImageGenError('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let prompt = '';
      if (sceneCount > 1) {
          prompt = `You are an expert scriptwriter and prompt engineer. Based on the following JSON prompt which represents Scene 1, generate a sequence of ${sceneCount} total scenes.
          Each scene must be a distinct JSON object.
          The entire output must be a single, valid JSON array containing these ${sceneCount} objects, and nothing else.
          Maintain continuity of character(s), setting, style, and overall context defined in the base JSON.
          Each scene must logically progress from the previous one to create a short, coherent narrative. Do not add any text or markdown formatting outside of the JSON array.

          Base JSON for Scene 1:
          ${generatedJson}`;
      } else {
          prompt = `You are an expert prompt engineer. Analyze the following JSON prompt designed for a generative AI.
          Your task is to generate ${promptCount} different, creative variations based on it.
          - If ${promptCount} is 1, refine and enhance the original JSON for maximum clarity and effectiveness.
          - If ${promptCount} is greater than 1, create distinct variations. Each variation should be a unique and complete JSON object.

          Return ONLY a valid JSON object (if creating 1 variation) or a valid JSON array of objects (if creating more than 1). Do not include any explanations, markdown formatting, or any text other than the JSON itself.

          Base JSON:
          ${generatedJson}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const cleanedResponse = response.text.replace(/```json\n|```/g, '').trim();
      
      const parsedJson = JSON.parse(cleanedResponse);
      const formattedJson = JSON.stringify(parsedJson, null, 2);

      setTunedJson(formattedJson);

    } catch (error) {
      console.error("Error generating prompts:", error);
      setTuningError(getFriendlyErrorMessage(error, currentTunerLabels.tuningError));
    } finally {
      setIsTuning(false);
    }
  };
  
  const handleGrammarCheck = async () => {
    setIsCheckingGrammar(true);
    setGrammarCheckError(null);
    setGrammarCheckResult(null);
    
    try {
      const textToCheck = [
        customText,
        ...Object.values(selections)
      ].filter(text => typeof text === 'string' && text.trim() !== '').join('. ');

      if (!textToCheck.trim()) {
        setGrammarCheckResult({ summary: currentGrammarCheckLabels.noIssues, suggestions: [] });
        setIsGrammarModalOpen(true);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const prompt = `You are a grammar and spelling expert for the ${languageMap[language]} language. Analyze the following text for any grammatical errors, spelling mistakes, or awkward phrasing. Provide a brief overall summary and a list of specific suggestions for improvement. Text to analyze: "${textToCheck}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A brief, one-sentence summary of the text's grammatical quality." },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING, description: "The original text snippet with the error." },
                    corrected: { type: Type.STRING, description: "The corrected version of the snippet." },
                    explanation: { type: Type.STRING, description: "A brief explanation of why the change was made." },
                  },
                   required: ['original', 'corrected', 'explanation'],
                },
              },
            },
             required: ['summary', 'suggestions'],
          },
        },
      });

      const cleanedResponse = response.text.trim();
      const parsedJson: GrammarCheckResult = JSON.parse(cleanedResponse);
      
      setGrammarCheckResult(parsedJson);
      setIsGrammarModalOpen(true);

    } catch (error) {
        console.error("Error checking grammar:", error);
        setGrammarCheckError(getFriendlyErrorMessage(error, currentGrammarCheckLabels.error));
        setIsGrammarModalOpen(true);
    } finally {
        setIsCheckingGrammar(false);
    }
  };

  const generateImageFromPromptJson = async (promptJson: string, imageCount: 1 | 2 = 2): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const textPromptGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following JSON prompt for a video/image, create a single, concise, descriptive paragraph that can be used as a text-to-image prompt. Focus on the visual elements: subject, action, setting, style, lighting, and color. JSON: ${promptJson}`
    });
    const imagePrompt = textPromptGenResponse.text;

    if (!imagePrompt) {
        throw new Error("Could not generate a text prompt from the JSON.");
    }
    
    let imagePromises = [];
    if (imageCount === 1) {
       imagePromises.push(ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: imagePrompt }] },
            config: { responseModalities: [Modality.IMAGE] }
        }));
    } else {
        imagePromises = [
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: imagePrompt }] },
                config: { responseModalities: [Modality.IMAGE] }
            }),
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: `A different perspective of: ${imagePrompt}` }] },
                config: { responseModalities: [Modality.IMAGE] }
            })
        ];
    }

    const imageResponses = await Promise.all(imagePromises);
    
    return imageResponses.map(response => {
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
            return part.inlineData.data;
        }
        throw new Error("Image data not found in one of the responses.");
    });
  };

  const handleGenerateImagePreview = async () => {
    setIsGeneratingImages(true);
    setGeneratedImages([]);
    setImageGenError('');
    try {
        const images = await generateImageFromPromptJson(tunedJson, 2);
        setGeneratedImages(images);
    } catch(error) {
        console.error("Error generating image preview:", error);
        setImageGenError(getFriendlyErrorMessage(error, currentUiLabels.previewError));
    } finally {
        setIsGeneratingImages(false);
    }
  };

  const handleGenerateTestImage = async () => {
    setIsGeneratingTestImage(true);
    setGeneratedImages([]);
    setImageGenError('');
     try {
        const images = await generateImageFromPromptJson(generatedJson, 2);
        setGeneratedImages(images);
    } catch(error) {
        console.error("Error generating test image:", error);
        setImageGenError(getFriendlyErrorMessage(error, currentUiLabels.previewError));
    } finally {
        setIsGeneratingTestImage(false);
    }
  };

  const handleTemplateChange = (templateKey: string) => {
    if (templateKey && currentTemplates[templateKey]) {
        const template = currentTemplates[templateKey];
        setSelections(prev => ({ ...prev, ...template.selections }));
    }
    setSelectedTemplate(templateKey);
  };
  
  const handleShareLink = () => {
      const dataToShare = {
          selections,
          customText,
          language
      };
      try {
          const encoded = btoa(encodeURIComponent(JSON.stringify(dataToShare)));
          const url = `${window.location.origin}${window.location.pathname}?prompt=${encoded}`;
          navigator.clipboard.writeText(url);
          setShareConfirmation(currentUiLabels.shareSuccess);
          setTimeout(() => setShareConfirmation(''), 2000);
      } catch (error) {
          console.error("Failed to create share link:", error);
      }
  };

  const handleSelectionChange = (key: PromptCategory, value: string) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };
  
  const handlePromptCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPromptCount(Number(e.target.value));
  };
  
  const handleSceneCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSceneCount(Number(e.target.value));
  };
  
  const toggleSection = (id: PromptGroupKey) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmShare = async (author: string, isTested: boolean, includeImage: boolean) => {
      const newSharedPrompt: Omit<SharedPrompt, 'id' | 'createdAt' | 'votes' | 'communityTestedCount'> = {
          author: author || currentUiLabels.authorPlaceholder,
          promptJson: generatedJson,
          customText,
          selections,
          isTestedByAuthor: isTested,
          testImageBase64: includeImage && generatedImages.length > 0 ? generatedImages[0] : undefined,
          language,
      };
      await saveSharedPrompt(newSharedPrompt);
      setIsShareModalOpen(false);
      setActiveTab('community');
  };

  const handleUsePrompt = (prompt: SharedPrompt) => {
    setLanguage(prompt.language);
    setSelections(prompt.selections);
    setCustomText(prompt.customText);
    if(prompt.testImageBase64) {
      setGeneratedImages([prompt.testImageBase64]);
    } else {
      setGeneratedImages([]);
    }
    setTunedJson('');
    setImageGenError('');
    setActiveTab('generator');
  };
  
  const buttonText = sceneCount > 1
    ? (isTuning ? currentTunerLabels.sequencingButton : currentTunerLabels.sequenceButton)
    : (isTuning ? currentTunerLabels.tuningButton : currentTunerLabels.tuneButton);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 transition-colors duration-300 flex flex-col">
      <div className="max-w-7xl mx-auto flex-grow w-full">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                Visionary AI Suite
            </h1>
            <p className="mt-2 text-lg text-gray-400">
                Editor, Photo, Prompt, JSON, AI
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap justify-center">
             {/* Language Selector */}
             <div className="relative">
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="appearance-none bg-gray-800 border border-gray-700 text-white py-2 pl-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    {(Object.keys(languageMap) as Language[]).map(lang => (
                        <option key={lang} value={lang}>{languageMap[lang]}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
             </div>

             {/* Theme Selector */}
             <div className="relative">
                <select
                    value={theme}
                    onChange={handleThemeChange}
                    className="appearance-none bg-gray-800 border border-gray-700 text-white py-2 pl-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    {Object.entries(THEMES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
             </div>

             {/* Sitemap Button */}
             <button
                onClick={() => setIsSitemapOpen(true)}
                className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title={currentUiLabels.sitemapTitle}
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                {currentUiLabels.sitemap}
             </button>
          </div>
        </header>

        <div className="border-b border-gray-700 mb-8">
            <nav className="flex space-x-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700">
                <TabButton tab="generator" label={currentUiLabels.generatorTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="tools" label={currentUiLabels.toolsTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="photos" label={currentUiLabels.photosTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="makeup" label={currentUiLabels.makeupTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="video" label={currentUiLabels.videoTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="social" label={currentUiLabels.socialTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="wiki" label={currentUiLabels.wikiTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="editor" label={currentUiLabels.editorTab} activeTab={activeTab} onClick={setActiveTab} />
                <TabButton tab="community" label={currentUiLabels.communityTab} activeTab={activeTab} onClick={setActiveTab} />
            </nav>
        </div>
        
        {activeTab === 'generator' && (
          <ErrorBoundary>
            <div className="mb-8 max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 items-end">
                <div className="col-span-2 sm:col-span-1 md:col-span-3">
                    <label htmlFor="template-select" className="block text-sm font-medium text-gray-400 mb-2">{currentUiLabels.templateSelect}</label>
                    <select
                      id="template-select"
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    >
                      <option value="">{currentUiLabels.searchPlaceholder}</option>
                      {Object.entries(currentTemplates).map(([key, template]) => (
                        <option key={key} value={key}>{(template as any)?.name}</option>
                      ))}
                    </select>
                </div>
                <div className="col-span-1">
                    <label htmlFor="scene-count-select" className="block text-sm font-medium text-gray-400 mb-2">{currentSceneQuantityLabel}</label>
                    <select
                      id="scene-count-select"
                      value={sceneCount}
                      onChange={handleSceneCountChange}
                      className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                </div>
                <div className="col-span-1">
                    <label htmlFor="prompt-count-select" className={`block text-sm font-medium text-gray-400 mb-2 ${sceneCount > 1 ? 'opacity-50' : ''}`}>{currentQuantityLabel}</label>
                    <select
                      id="prompt-count-select"
                      value={promptCount}
                      disabled={sceneCount > 1}
                      onChange={handlePromptCountChange}
                      className="w-full bg-gray-800 border-gray-700 text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out p-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                </div>
                <div className="flex flex-col items-center justify-center space-y-2 col-span-2 sm:col-span-4 md:col-span-1 md:flex-row md:space-y-0 md:space-x-2">
                  <label htmlFor="autosave-toggle" className="text-sm font-medium text-gray-400">{currentUiLabels.autoSave}</label>
                  <button
                    type="button"
                    id="autosave-toggle"
                    onClick={handleAutoSaveToggle}
                    className={`${autoSave ? 'bg-indigo-600' : 'bg-gray-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
                    role="switch"
                    aria-checked={autoSave}
                  >
                    <span className={`${autoSave ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                  </button>
                </div>
                <div className="flex items-center justify-center col-span-2 sm:col-span-4 md:col-span-full gap-4">
                    {isAuthenticated && (
                        <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg border border-green-500/30">
                            <span className="text-sm text-green-400">{currentUiLabels.loggedIn}</span>
                            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white" title={currentUiLabels.logout}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                            </button>
                        </div>
                    )}
                    {isDriveConnected && (
                        <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg border border-blue-500/30">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                                    <path d="M18.972 15.568L22.662 9.175L12.84 9.175L8.077 17.422C8.077 17.422 17.232 17.422 17.9 17.422C18.335 17.422 18.745 16.76 18.972 15.568Z" fill="#4285F4" />
                                    <path d="M6.515 14.687L3.775 9.932C3.775 9.932 8.625 1.522 8.625 1.522L13.45 9.932L6.515 14.687Z" fill="#34A853" />
                                    <path d="M5.477 16.522L9.167 22.915C9.167 22.915 18.867 22.915 18.867 22.915L14.042 14.505C14.042 14.505 5.477 14.505 5.477 16.522Z" fill="#1967D2" />
                                    <path d="M12.84 9.175L9.15 2.782C9.15 2.782 4.295 11.192 4.295 11.192L8.077 17.422L12.84 9.175Z" fill="#FBBC05" />
                                    <path d="M13.45 9.932L18.275 1.522C18.275 1.522 8.625 1.522 8.625 1.522L12.84 9.175L13.45 9.932Z" fill="#EA4335" />
                                </g>
                            </svg>
                            <span className="text-sm text-blue-400">{currentUiLabels.driveConnected}</span>
                            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white" title={currentUiLabels.logout}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-200">{currentUiLabels.optionsTitle}</h2>
                    <button 
                        onClick={() => setIsHelpModalOpen(true)} 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
                        title={currentUiLabels.helpModalTitle}
                    >
                        ?
                    </button>
                </div>
                <div className="space-y-6">
                  <div className="mb-4">
                    <TextArea
                      id="custom-text"
                      label={currentCustomTextLabels.label}
                      value={customText}
                      placeholder={currentCustomTextLabels.placeholder}
                      onChange={setCustomText}
                    />
                  </div>
                  {PROMPT_GROUPS.map((group) => (
                    <div key={group.id} className="border-t border-gray-700/50 pt-4">
                        <button onClick={() => toggleSection(group.id)} className="w-full flex justify-between items-center text-left">
                            <h3 className="text-lg font-semibold text-indigo-400">
                                {currentGroupLabels[group.id]}
                            </h3>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 text-indigo-400 transition-transform duration-300 ${openSections[group.id] ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                        {openSections[group.id] && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {group.categories.map((key) => (
                                    <Selector
                                    key={key}
                                    id={key}
                                    label={currentCategoryLabels[key]}
                                    value={selections[key] || ''}
                                    options={currentOptions[key]}
                                    onChange={(value) => handleSelectionChange(key, value)}
                                    searchPlaceholder={currentUiLabels.searchPlaceholder}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-8 lg:max-h-[calc(100vh-10rem)]">
                <div className="flex-1 flex flex-col min-h-0 bg-gray-800/50 p-6 rounded-lg shadow-lg">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-200">{currentUiLabels.generatedJsonTitle}</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={handleClearAll} className="flex items-center justify-center p-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50" title={currentUiLabels.clear}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992a8.25 8.25 0 0 0-11.667 0v4.992m16.66-4.992l-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 5.006m16.66 4.992h-4.992" /></svg>
                            </button>
                            <button onClick={handleGrammarCheck} disabled={isCheckingGrammar || isTuning} className="flex items-center justify-center p-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50" title={currentGrammarCheckLabels.checkButton}>
                                {isCheckingGrammar ? <Spinner /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                            </button>
                            <div className="relative">
                                <button onClick={handleShareLink} className="flex items-center justify-center p-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600" title={currentUiLabels.share}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>
                                </button>
                                {shareConfirmation && <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-indigo-600 px-2 py-1 text-xs text-white">{shareConfirmation}</span>}
                            </div>
                            <button onClick={() => setIsShareModalOpen(true)} disabled={!generatedJson.trim() || generatedJson.trim() === '{}'} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors" title={currentUiLabels.shareToCommunity}>
                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                               {currentUiLabels.shareToCommunity}
                            </button>
                            <button onClick={handleGenerateTestImage} disabled={isGeneratingTestImage || isTuning || !generatedJson.trim() || generatedJson.trim() === '{}'} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors">
                                {isGeneratingTestImage && <Spinner /> }
                                {isGeneratingTestImage ? currentUiLabels.generatingTestImage : currentUiLabels.generateTestImage}
                            </button>
                            <button onClick={handleGeneratePrompts} disabled={isTuning || !generatedJson.trim() || generatedJson.trim() === '{}'} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
                                {isTuning && <Spinner /> }
                                {buttonText}
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <CodeBlock code={generatedJson} />
                    </div>
                </div>

                {(isTuning || tunedJson || tuningError) && (
                    <div className="flex-1 flex flex-col min-h-0 bg-gray-800/50 p-6 rounded-lg shadow-lg">
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-200">{currentTunerLabels.tunedPromptTitle}</h2>
                            {tunedJson && !isTuning && !tuningError && (
                                <button onClick={handleGenerateImagePreview} disabled={isGeneratingImages} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors">
                                    {isGeneratingImages && <Spinner />}
                                    {isGeneratingImages ? currentUiLabels.generatingPreview : currentUiLabels.generatePreview}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-h-0 flex items-center justify-center">
                            {isTuning && (
                                <div className="text-center text-gray-400 flex flex-col items-center">
                                    <Spinner />
                                    <p className="mt-2 animate-pulse">{currentTunerLabels.loading}</p>
                                </div>
                            )}
                            {tuningError && <p className="text-red-400 text-center">{tuningError}</p>}
                            {tunedJson && !isTuning && !tuningError && (
                                <div className="w-full h-full">
                                    <CodeBlock code={tunedJson} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                <ImagePreview 
                    isLoading={isGeneratingImages || isGeneratingTestImage}
                    images={generatedImages}
                    error={imageGenError}
                    labels={currentUiLabels}
                />
              </div>
            </main>
          </ErrorBoundary>
        )}
        
        {activeTab === 'tools' && (
           <ErrorBoundary>
             <AiTools labels={currentAiToolsLabels} language={language} />
           </ErrorBoundary>
        )}

        {activeTab === 'photos' && (
           <ErrorBoundary>
             <PhotoTools labels={currentAiToolsLabels} />
           </ErrorBoundary>
        )}

        {activeTab === 'makeup' && (
           <ErrorBoundary>
             <MakeupStudio labels={currentMakeupLabels} />
           </ErrorBoundary>
        )}

        {activeTab === 'video' && (
           <ErrorBoundary>
             <VideoTools labels={currentVideoLabels} />
           </ErrorBoundary>
        )}

        {activeTab === 'social' && (
           <ErrorBoundary>
             <SocialMediaTools labels={currentSocialLabels} />
           </ErrorBoundary>
        )}

        {activeTab === 'wiki' && (
           <ErrorBoundary>
             <WikiTools labels={currentWikiLabels} />
           </ErrorBoundary>
        )}

        {activeTab === 'editor' && (
           <ErrorBoundary>
             <MiniEditor labels={currentUiLabels} />
           </ErrorBoundary>
        )}

        {activeTab === 'community' && (
           <ErrorBoundary>
             <CommunityFeed labels={currentUiLabels} onUsePrompt={handleUsePrompt} />
           </ErrorBoundary>
        )}

        {/* Global Footer Ad and Credits */}
        <div className="mt-auto pt-10">
            <GoogleAd 
                slot="1234567890" // Replace with real slot ID
                testMode={true} // Remove this or set to false in production
                style={{ minHeight: '90px' }}
            />
            
            <footer className="text-center py-6 border-t border-gray-800 bg-gray-900/50 text-gray-500 text-sm mt-4">
               <p>&copy; {new Date().getFullYear()} Visionary AI Suite. {currentUiLabels.credit}</p>
            </footer>
        </div>

      </div>
      <GrammarCheckModal
        isOpen={isGrammarModalOpen}
        onClose={() => setIsGrammarModalOpen(false)}
        result={grammarCheckResult}
        isLoading={isCheckingGrammar}
        error={grammarCheckError}
        labels={currentGrammarCheckLabels}
      />
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        labels={currentUiLabels}
        categoryLabels={currentCategoryLabels}
      />
      <SiteMapModal
        isOpen={isSitemapOpen}
        onClose={() => setIsSitemapOpen(false)}
        onNavigate={setActiveTab}
        language={language}
        labels={currentUiLabels}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        labels={currentUiLabels}
       />
       <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onConfirm={handleConfirmShare}
        labels={currentUiLabels}
        hasImage={generatedImages.length > 0}
       />
    </div>
  );
};

export default App;
