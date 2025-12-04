
export type Language = 'pt' | 'en' | 'fr' | 'hi' | 'ru';

export type PromptCategory = 
  | 'task'
  | 'articleType'
  | 'role' 
  | 'background' 
  | 'objective' 
  | 'audience' 
  | 'theme'
  | 'settingLocation'
  | 'mainSubject'
  | 'characterAction'
  | 'expression'
  | 'clothingAttributes'
  | 'tone' 
  | 'perspective'
  | 'timeOfDay'
  | 'weatherConditions'
  | 'lighting' 
  | 'colorPalette'
  | 'style' 
  | 'movement' 
  | 'cameraAngle'
  | 'lensType'
  | 'aspect' 
  | 'duration' 
  | 'effects'
  | 'negativePrompts'
  | 'complexity'
  | 'resolution'
  | 'renderingEngine'
  | 'length' 
  | 'format'
  | 'constraints' 
  | 'detailLevel';

export type PromptGroupKey = 
  | 'coreContext'
  | 'subjectDetails'
  | 'sceneSetup'
  | 'cinematography'
  | 'postProduction'
  | 'outputConstraints';

export type PromptGroup = {
    id: PromptGroupKey;
    categories: PromptCategory[];
};

export type PromptSelections = {
  [key in PromptCategory]?: string;
};

export type PromptOptions = {
  [lang in Language]: {
    [cat in PromptCategory]: string[];
  };
};

export interface GrammarSuggestion {
  original: string;
  corrected: string;
  explanation: string;
}

export interface GrammarCheckResult {
  summary: string;
  suggestions: GrammarSuggestion[];
}

export type PromptTemplate = {
  [templateName: string]: {
    name: string;
    selections: PromptSelections;
  };
};

export type PromptTemplates = {
  [lang in Language]: PromptTemplate;
};

export type VoteType = 'up' | 'down';

export interface SharedPrompt {
  id: string;
  author: string;
  createdAt: number;
  promptJson: string;
  customText: string;
  selections: PromptSelections;
  isTestedByAuthor: boolean;
  testImageBase64?: string;
  votes: {
    up: number;
    down: number;
  };
  communityTestedCount: number;
  language: Language;
}

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username?: string;
}

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  shares?: { count: number };
  attachments?: {
    data: Array<{
      media?: { image: { src: string } };
      type: string;
      url: string;
    }>;
  };
}

export interface TikTokPost {
  id: string;
  desc: string;
  createTime: number;
  videoUrl: string;
  coverUrl?: string;
  author: string;
  stats: {
    plays: number;
    digg: number;
    comment: number;
    share: number;
  };
}

export type Theme = 'dark' | 'light' | 'high-contrast';

export const languageMap: Record<Language, string> = {
    pt: '🇧🇷 Português',
    en: '🇺🇸 English',
    fr: '🇫🇷 Français',
    hi: '🇮🇳 हिन्दी',
    ru: '🇷🇺 Русский'
};