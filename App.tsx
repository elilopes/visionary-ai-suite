
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Selector from './components/Selector';
import CodeBlock from './components/CodeBlock';
import TextArea from './components/TextArea';
import Spinner from './Spinner';
import AuthModal from './components/AuthModal';
import CommunityFeed from './components/CommunityFeed';
import AiTools from './components/AiTools';
import PhotoTools from './components/PhotoTools';
import MakeupStudio from './components/MakeupStudio';
import VideoTools from './components/VideoTools';
import WikiTools from './components/WikiTools';
import MiniEditor from './components/MiniEditor';
import SocialMediaTools from './components/SocialMediaTools';
import ErrorBoundary from './components/ErrorBoundary';
import SiteMapModal from './components/SiteMapModal';
import { PROMPT_OPTIONS, CATEGORY_LABELS, PROMPT_GROUPS, GROUP_LABELS, UI_LABELS, AI_TOOLS_LABELS, MAKEUP_TOOLS_LABELS, VIDEO_TOOLS_LABELS, WIKI_TOOLS_LABELS, SOCIAL_TOOLS_LABELS, EDITOR_LABELS, THEMES } from './constants';
import type { Language, PromptSelections, PromptCategory, Theme } from './types';
import { languageMap } from './types';

type AppTab = 'generator' | 'tools' | 'photos' | 'makeup' | 'video' | 'wiki' | 'editor' | 'community' | 'social';

const TabButton: React.FC<{ tab: AppTab; label: string; activeTab: AppTab; onClick: (tab: AppTab) => void }> = ({ tab, label, activeTab, onClick }) => (
   <button onClick={() => onClick(tab)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all duration-200 whitespace-nowrap border-b-2 ${activeTab === tab ? 'bg-[var(--bg-input)] text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'}`}>
      {label}
   </button>
);

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('dark');
  const [selections, setSelections] = useState<PromptSelections>({});
  const [customText, setCustomText] = useState('');
  const [generatedJson, setGeneratedJson] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('generator');
  const [isSitemapOpen, setIsSitemapOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const labels = useMemo(() => UI_LABELS[language] || UI_LABELS['en'], [language]);
  const currentOptions = useMemo(() => PROMPT_OPTIONS[language] || PROMPT_OPTIONS['en'], [language]);
  const currentCategoryLabels = useMemo(() => CATEGORY_LABELS[language] || CATEGORY_LABELS['en'], [language]);
  const currentGroupLabels = useMemo(() => GROUP_LABELS[language] || GROUP_LABELS['en'], [language]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const initializeSelections = useCallback(() => {
    const initial: PromptSelections = {};
    PROMPT_GROUPS.forEach(group => {
      group.categories.forEach(cat => {
        // Safe access to prevent reading properties of undefined
        const categoryOptions = currentOptions?.[cat];
        initial[cat] = (categoryOptions && categoryOptions.length > 0) ? categoryOptions[0] : '';
      });
    });
    setSelections(initial);
  }, [currentOptions]);

  useEffect(() => {
    initializeSelections();
  }, [language, initializeSelections]);

  useEffect(() => {
    const coreKeys: PromptCategory[] = ['task', 'role', 'background', 'length'];
    const finalData: any = { 
        metadata: { language, generator: "Visionary AI Suite", version: "2.5" },
        prompt_core: {},
        advanced_constraints: {},
        additional_instructions: customText.trim() || undefined
    };

    coreKeys.forEach(key => {
        if (selections[key]) finalData.prompt_core[key] = selections[key];
    });

    Object.entries(selections).forEach(([key, val]) => {
        if (!coreKeys.includes(key as PromptCategory) && val) {
            finalData.advanced_constraints[key] = val;
        }
    });

    setGeneratedJson(JSON.stringify(finalData, null, 2));
  }, [selections, customText, language]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col font-sans transition-colors duration-200" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Filtros SVG para acessibilidade Daltonismo */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      <div className="max-w-7xl mx-auto flex-grow w-full">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 border-b border-[var(--border-main)] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                <span className="text-xl font-black text-white">V</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{labels.title}</h1>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
             <div className="flex items-center gap-1 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg p-1 shadow-sm">
                {(Object.keys(THEMES) as Theme[]).map(t => (
                    <button 
                        key={t}
                        onClick={() => setTheme(t)}
                        title={labels.themes?.[t] || t}
                        className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${theme === t ? 'bg-[var(--accent)] text-white scale-105 shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)]'}`}
                    >
                        {t === 'dark' && '🌙'}
                        {t === 'light' && '☀️'}
                        {t === 'high-contrast' && '👁️'}
                        {t === 'deuteranopia' && 'G'}
                        {t === 'protanopia' && 'R'}
                        {t === 'tritanopia' && 'B'}
                    </button>
                ))}
             </div>

             <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="bg-[var(--bg-panel)] border border-[var(--border-main)] text-sm font-bold py-2 px-4 rounded-lg focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none">
                {(Object.keys(languageMap) as Language[]).map(lang => (
                    <option key={lang} value={lang}>{languageMap[lang]}</option>
                ))}
             </select>
             <button onClick={() => setIsSitemapOpen(true)} className="bg-[var(--bg-panel)] border border-[var(--border-main)] hover:bg-[var(--bg-input)] text-xs font-bold py-2 px-4 rounded-lg transition-colors uppercase tracking-widest">
                {labels.sitemap}
             </button>
          </div>
        </header>

        <nav className="flex space-x-1 overflow-x-auto pb-4 custom-scrollbar mb-6 border-b border-[var(--border-main)]">
            {(['generator', 'tools', 'photos', 'makeup', 'video', 'social', 'wiki', 'editor', 'community'] as AppTab[]).map(tab => (
                <TabButton key={tab} tab={tab} label={labels[`${tab}Tab`]} activeTab={activeTab} onClick={setActiveTab} />
            ))}
        </nav>
        
        <div className="animate-fade-in mt-4">
            {activeTab === 'generator' && (
              <ErrorBoundary>
                 <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-[var(--bg-panel)] p-6 rounded-2xl border border-[var(--border-main)] shadow-[var(--shadow)]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-[var(--accent)]/10 rounded-lg"><svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
                            <h2 className="text-xl font-bold">{labels.optionsTitle}</h2>
                        </div>
                        
                        <div className="space-y-8">
                            {PROMPT_GROUPS.map((group) => (
                                <div key={group.id} className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-px bg-[var(--border-main)] flex-grow opacity-50"></div>
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-2">{currentGroupLabels[group.id]}</span>
                                        <div className="h-px bg-[var(--border-main)] flex-grow opacity-50"></div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {group.categories.map((key) => (
                                            <Selector key={key} id={key} label={currentCategoryLabels[key]} value={selections[key] || ''} options={currentOptions?.[key] || []} onChange={(val) => setSelections(prev => ({...prev, [key]: val}))} searchPlaceholder={labels.searchPlaceholder} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="pt-4">
                                <TextArea id="custom-text" label={labels.customTextLabels?.label || "Instructions"} value={customText} placeholder={labels.customTextLabels?.placeholder || "Add details..."} onChange={setCustomText} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-[var(--bg-panel)] p-6 rounded-2xl border border-[var(--border-main)] shadow-[var(--shadow)] h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-[var(--accent)]">{labels.generatedJsonTitle}</h2>
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20 font-bold uppercase">Ready</span>
                            </div>
                            <div className="flex-grow">
                                <CodeBlock code={generatedJson} />
                            </div>
                        </div>
                    </div>
                 </main>
              </ErrorBoundary>
            )}
            
            {activeTab === 'tools' && <ErrorBoundary><AiTools labels={{...labels, ...(AI_TOOLS_LABELS[language] || AI_TOOLS_LABELS['en'])}} language={language} /></ErrorBoundary>}
            {activeTab === 'photos' && <ErrorBoundary><PhotoTools labels={{...labels, ...(AI_TOOLS_LABELS[language] || AI_TOOLS_LABELS['en'])}} /></ErrorBoundary>}
            {activeTab === 'makeup' && <ErrorBoundary><MakeupStudio labels={{...labels, ...(MAKEUP_TOOLS_LABELS[language] || MAKEUP_TOOLS_LABELS['en'])}} /></ErrorBoundary>}
            {activeTab === 'video' && <ErrorBoundary><VideoTools labels={{...labels, ...(VIDEO_TOOLS_LABELS[language] || VIDEO_TOOLS_LABELS['en'])}} /></ErrorBoundary>}
            {activeTab === 'social' && <ErrorBoundary><SocialMediaTools labels={{...labels, ...(SOCIAL_TOOLS_LABELS[language] || SOCIAL_TOOLS_LABELS['en'])}} /></ErrorBoundary>}
            {activeTab === 'wiki' && <ErrorBoundary><WikiTools labels={{...labels, ...(WIKI_TOOLS_LABELS[language] || WIKI_TOOLS_LABELS['en'])}} /></ErrorBoundary>}
            {activeTab === 'editor' && <ErrorBoundary><MiniEditor labels={{...labels, ...(EDITOR_LABELS[language] || EDITOR_LABELS['en'])}} /></ErrorBoundary>}
            {activeTab === 'community' && <ErrorBoundary><CommunityFeed labels={labels} onUsePrompt={() => {}} /></ErrorBoundary>}
        </div>

        <footer className="mt-16 text-center py-8 border-t border-[var(--border-main)] text-[var(--text-muted)] text-xs">
           <p className="mb-2">&copy; {new Date().getFullYear()} Visionary AI Suite. {labels.credit}</p>
           <p className="text-[10px] opacity-40">Professional Prompt Engineering Framework v2.5.1</p>
        </footer>
      </div>
      <SiteMapModal isOpen={isSitemapOpen} onClose={() => setIsSitemapOpen(false)} onNavigate={setActiveTab} language={language} labels={labels} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={() => {}} labels={labels} />
    </div>
  );
};

export default App;
