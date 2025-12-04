
import React from 'react';
import TextSummarizer from './TextSummarizer';
import YouTubeTranscriber from './YouTubeTranscriber';
import ArticleGenerator from './ArticleGenerator';
import DiscountAnalyzer from './DiscountAnalyzer';
import PriceComparator from './PriceComparator';
import BibliographyOrganizer from './BibliographyOrganizer';
import CitationGenerator from './CitationGenerator';
import ResearchAssistant from './ResearchAssistant';
import InvestmentPortfolioAdvisor from './InvestmentPortfolioAdvisor';
import AssetComparator from './AssetComparator';
import RealTimeSearch from './RealTimeSearch';
import FinancialAdvisor from './FinancialAdvisor';
import LegalAssistant from './LegalAssistant';
import DataAnalyzer from './DataAnalyzer';
import SocialMediaPlanner from './SocialMediaPlanner';
import TopicSimplifier from './TopicSimplifier';
import StudyGuideGenerator from './StudyGuideGenerator';
import AcademicSourceFinder from './AcademicSourceFinder';
import AssignmentAnalyzer from './AssignmentAnalyzer';
import VocabularyBuilder from './VocabularyBuilder';
import LanguageLearningPlan from './LanguageLearningPlan';
import PdfSummarizer from './PdfSummarizer';
import VideoToPdf from './VideoToPdf';
import TextHumanizer from './TextHumanizer';
import MindMapGenerator from './MindMapGenerator';
import RoutePlanner from './RoutePlanner';
import GameAssetGenerator from './GameAssetGenerator';
import HtmlGenerator from './HtmlGenerator';
import InterviewPrep from './InterviewPrep';
import EmailGenerator from './EmailGenerator';
import ResumeGenerator from './ResumeGenerator';
import AbntFormatter from './AbntFormatter';
import ToolSection from './ToolSection';
import ReferenceGenerator from './ReferenceGenerator';

interface AiToolsProps {
    labels: any;
    language: string;
}

const AiTools: React.FC<AiToolsProps> = ({ labels, language }) => {
    return (
        <div className="max-w-5xl mx-auto">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-200">{labels.title}</h2>
            </header>
            <div className="space-y-6">
                <ToolSection title="Visual & Creative" defaultOpen={true}>
                    {/* Image tools moved to PhotoTools */}
                    <GameAssetGenerator labels={labels} />
                    <HtmlGenerator labels={labels} />
                    <MindMapGenerator labels={labels} />
                </ToolSection>

                <ToolSection title="Documents & Utilities">
                    <ResumeGenerator labels={labels} />
                    <AbntFormatter labels={labels} />
                    <PdfSummarizer labels={labels} />
                    <VideoToPdf labels={labels} />
                    <RoutePlanner labels={labels} />
                    <TextHumanizer labels={labels} />
                    <EmailGenerator labels={labels} />
                </ToolSection>

                <ToolSection title="Education & Career">
                    <InterviewPrep labels={labels} />
                    <StudyGuideGenerator labels={labels} />
                    <AcademicSourceFinder labels={labels} />
                    <AssignmentAnalyzer labels={labels} />
                    <VocabularyBuilder labels={labels} />
                    <LanguageLearningPlan labels={labels} />
                </ToolSection>

                <ToolSection title="Business & Finance">
                    <RealTimeSearch labels={labels} />
                    <FinancialAdvisor labels={labels} />
                    <LegalAssistant labels={labels} />
                    <SocialMediaPlanner labels={labels} />
                    <DataAnalyzer labels={labels} />
                    <InvestmentPortfolioAdvisor labels={labels} language={language} />
                    <AssetComparator labels={labels} />
                    <DiscountAnalyzer labels={labels} />
                    <PriceComparator labels={labels} />
                </ToolSection>

                <ToolSection title="Writing & Research">
                    <TopicSimplifier labels={labels} />
                    <TextSummarizer labels={labels} />
                    <ArticleGenerator labels={labels} />
                    <ResearchAssistant labels={labels} />
                    <CitationGenerator labels={labels} />
                    <ReferenceGenerator labels={labels} />
                    <BibliographyOrganizer labels={labels} />
                    <YouTubeTranscriber labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default AiTools;
