
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
import MathSolver from './MathSolver';

interface AiToolsProps {
    labels: any;
    language: string;
}

const AiTools: React.FC<AiToolsProps> = ({ labels, language }) => {
    // Verificação de segurança para evitar crash se labels estiverem incompletas
    if (!labels || !labels.title) {
        return (
            <div className="flex justify-center items-center h-64 text-[var(--text-muted)]">
                Carregando ferramentas de IA...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-main)]">{labels.title}</h2>
                <p className="text-[var(--text-muted)] mt-2">Poderosas ferramentas multimodais integradas.</p>
            </header>
            <div className="space-y-6">
                <ToolSection title="Educação & Carreira" defaultOpen={true}>
                    <MathSolver labels={labels} />
                    <ResumeGenerator labels={labels} />
                    <InterviewPrep labels={labels} />
                    <StudyGuideGenerator labels={labels} />
                    <AcademicSourceFinder labels={labels} />
                    <AssignmentAnalyzer labels={labels} />
                    <VocabularyBuilder labels={labels} />
                    <LanguageLearningPlan labels={labels} />
                </ToolSection>

                <ToolSection title="Documentos & Utilidades Profissionais">
                    <AbntFormatter labels={labels} />
                    <PdfSummarizer labels={labels} />
                    <VideoToPdf labels={labels} />
                    <RoutePlanner labels={labels} />
                    <TextHumanizer labels={labels} />
                    <EmailGenerator labels={labels} />
                    <HtmlGenerator labels={labels} />
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

                <ToolSection title="Escrita & Pesquisa Acadêmica">
                    <TopicSimplifier labels={labels} />
                    <ReferenceGenerator labels={labels} />
                    <TextSummarizer labels={labels} />
                    <ArticleGenerator labels={labels} />
                    <ResearchAssistant labels={labels} />
                    <CitationGenerator labels={labels} />
                    <BibliographyOrganizer labels={labels} />
                    <YouTubeTranscriber labels={labels} />
                </ToolSection>

                <ToolSection title="Visual & Planejamento">
                    <GameAssetGenerator labels={labels} />
                    <MindMapGenerator labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default AiTools;
