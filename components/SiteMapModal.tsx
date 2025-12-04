
import React from 'react';
import { AI_TOOLS_LABELS, MAKEUP_TOOLS_LABELS, VIDEO_TOOLS_LABELS, SOCIAL_TOOLS_LABELS, WIKI_TOOLS_LABELS, EDITOR_LABELS, UI_LABELS } from '../constants';

interface SiteMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: any) => void;
    language: string;
    labels: any;
}

const SiteMapModal: React.FC<SiteMapModalProps> = ({ isOpen, onClose, onNavigate, language, labels }) => {
    if (!isOpen) return null;

    // Get current language labels or fallback to English
    const currentAi = AI_TOOLS_LABELS[language] || AI_TOOLS_LABELS['en'];
    const currentMakeup = MAKEUP_TOOLS_LABELS[language] || MAKEUP_TOOLS_LABELS['en'];
    const currentVideo = VIDEO_TOOLS_LABELS[language] || VIDEO_TOOLS_LABELS['en'];
    const currentWiki = WIKI_TOOLS_LABELS[language] || WIKI_TOOLS_LABELS['en'];
    const currentSocial = SOCIAL_TOOLS_LABELS[language] || SOCIAL_TOOLS_LABELS['en'];
    const currentEditor = EDITOR_LABELS[language] || EDITOR_LABELS['en'];
    const currentUi = UI_LABELS[language] || UI_LABELS['en'];

    // Map data structure for the grid
    const siteMapData = [
        {
            tab: 'generator',
            title: currentUi.generatorTab,
            items: ['Advanced Prompt Engineering', 'Prompt Tuner', 'Test Image Generation', 'Grammar Check']
        },
        {
            tab: 'tools',
            title: currentUi.toolsTab,
            items: [
                currentAi.summarizerTitle, currentAi.transcriberTitle, currentAi.articleGeneratorTitle,
                currentAi.financialAdvisorTitle, currentAi.legalAssistantTitle, currentAi.portfolioAdvisorTitle,
                currentAi.realTimeSearchTitle, currentAi.studyGuideTitle, currentAi.resumeGeneratorTitle,
                currentAi.abntFormatterTitle, currentAi.emailWriterTitle, currentAi.mindMapTitle,
                currentAi.gameAssetsTitle, currentAi.htmlGeneratorTitle, currentAi.referenceGeneratorTitle
            ]
        },
        {
            tab: 'photos',
            title: currentUi.photosTab,
            items: [
                currentAi.arFiltersTitle, currentAi.liquifyTitle, 'Image Analyzer', 'Visual Storyteller',
                'Style Transformer', 'Cartoon Generator', 'Doll Generator', 'Background Replacer',
                'Image Colorizer', 'Image Restorer', 'Object Remover', 'Virtual Fitting Room',
                'Body Shape Changer', 'Wig Try On', '3D Photo Generator', '3D Object Generator'
            ]
        },
        {
            tab: 'makeup',
            title: currentUi.makeupTab,
            items: [
                currentMakeup.tools.lipstick, currentMakeup.tools.blush, currentMakeup.tools.foundation,
                currentMakeup.tools.contour, currentMakeup.tools.whitening, currentMakeup.tools.slim,
                currentMakeup.tools.autoFix, currentMakeup.tools.removeBg
            ]
        },
        {
            tab: 'video',
            title: currentUi.videoTab,
            items: [
                currentVideo.videoDownloaderTitle, currentVideo.converterWasmTitle, currentVideo.audioVisualizerTitle,
                currentVideo.vocalRemoverTitle, currentVideo.avatarTalkerTitle, currentVideo.cropperTitle,
                currentVideo.quoteVideoTitle, currentVideo.captionerTitle, currentVideo.transcriberTitle,
                currentVideo.ideatorTitle, currentVideo.converterTitle
            ]
        },
        {
            tab: 'social',
            title: currentUi.socialTab,
            items: [
                currentSocial.instaFeedTitle, currentSocial.fbFeedTitle, currentSocial.tiktokFeedTitle, 
                'Sentiment Analysis', 'Caption Generator', 'Engagement Analysis'
            ]
        },
        {
            tab: 'wiki',
            title: currentUi.wikiTab,
            items: [
                currentWiki.citationFinderTitle, currentWiki.wikitextTitle, currentWiki.wikidataTitle,
                currentWiki.sparqlTitle, currentWiki.stubTitle
            ]
        },
        {
            tab: 'editor',
            title: currentUi.editorTab,
            items: [
                currentEditor.title, currentEditor.tools.move, currentEditor.tools.resize,
                currentEditor.tools.wand, 'Layers', 'Blend Modes'
            ]
        },
        {
            tab: 'community',
            title: currentUi.communityTab,
            items: [
                currentUi.communityFeatureTitle, currentUi.proTip
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-indigo-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        {labels.sitemapTitle || "Application Sitemap"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {siteMapData.map((section) => (
                            <div key={section.tab} className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 hover:border-indigo-500/50 transition-colors">
                                <h3 className="text-lg font-bold text-indigo-400 mb-3 border-b border-gray-700 pb-2 flex justify-between items-center">
                                    {section.title}
                                    <button 
                                        onClick={() => { onNavigate(section.tab); onClose(); }}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        Go
                                    </button>
                                </h3>
                                <ul className="space-y-2">
                                    {section.items.map((item, idx) => (
                                        <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 bg-gray-900 border-t border-gray-700 text-center text-gray-500 text-xs">
                    {labels.credit || "By Elias Lopes / TechViva"}
                </div>
            </div>
        </div>
    );
};

export default SiteMapModal;
