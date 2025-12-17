
import React from 'react';
import ImageAnalyzer from './ImageAnalyzer';
import LogoGenerator from './LogoGenerator';
import ImageCaptionGenerator from './ImageCaptionGenerator';
import VisualStoryteller from './VisualStoryteller';
import ColorPaletteExtractor from './ColorPaletteExtractor';
import TextToImageGenerator from './TextToImageGenerator';
import ImageColorizer from './ImageColorizer';
import ImageRestorer from './ImageRestorer';
import CartoonGenerator from './CartoonGenerator';
import DollGenerator from './DollGenerator';
import DollHolderGenerator from './DollHolderGenerator';
import VirtualFittingRoom from './VirtualFittingRoom';
import BodyShapeChanger from './BodyShapeChanger';
import WigTryOn from './WigTryOn';
import ObjectRemover from './ObjectRemover';
import ImageExpander from './ImageExpander';
import BackgroundBlur from './BackgroundBlur';
import BackgroundReplacer from './BackgroundReplacer';
import MixMatchTryOn from './MixMatchTryOn';
import ExpressionGenerator from './ExpressionGenerator';
import PaintingGenerator from './PaintingGenerator';
import BnWGenerator from './BnWGenerator';
import StorybookGenerator from './StorybookGenerator';
import StyleTransformer from './StyleTransformer';
import ThreeDPhotoGenerator from './ThreeDPhotoGenerator';
import ThreeDObjectGenerator from './ThreeDObjectGenerator';
import ImageSonifier from './ImageSonifier';
import ToolSection from './ToolSection';
import ArFilters from './ArFilters';
import LiquifyEditor from './LiquifyEditor';
import AutoPhotoEnhancer from './AutoPhotoEnhancer';
import ManualEnhancer from './ManualEnhancer';
import SketchToImage from './SketchToImage';

interface PhotoToolsProps {
    labels: any;
}

const PhotoTools: React.FC<PhotoToolsProps> = ({ labels }) => {
    // Verificação de segurança para evitar crash se as labels específicas do estúdio de foto faltarem
    if (!labels || !labels.photoTitle) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-[var(--text-muted)] space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                <p>Configurando Photo Studio...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-main)]">{labels.photoTitle}</h2>
                <p className="text-[var(--text-muted)] mt-2">IA de última geração para processamento de imagem.</p>
            </header>
            <div className="space-y-6">
                <ToolSection title="Melhoria & Retoque" defaultOpen={true}>
                    <AutoPhotoEnhancer labels={labels} />
                    <ManualEnhancer labels={labels} />
                </ToolSection>

                <ToolSection title="Realidade Aumentada & Filtros">
                    <ArFilters labels={labels} />
                </ToolSection>

                <ToolSection title="Distorção & Edição Manual">
                    <LiquifyEditor labels={labels} />
                </ToolSection>

                <ToolSection title="Sinergia Áudio-Visual">
                    <ImageSonifier labels={labels} />
                </ToolSection>

                <ToolSection title="Análise & Legendas">
                    <ImageAnalyzer labels={labels} />
                    <ColorPaletteExtractor labels={labels} />
                    <ImageCaptionGenerator labels={labels} />
                </ToolSection>

                <ToolSection title="Narrativa & Criatividade">
                    <StorybookGenerator labels={labels} />
                    <VisualStoryteller labels={labels} />
                </ToolSection>

                <ToolSection title="Transformação de Estilo">
                    <StyleTransformer labels={labels} />
                    <ThreeDPhotoGenerator labels={labels} />
                    <DollHolderGenerator labels={labels} />
                    <CartoonGenerator labels={labels} />
                    <DollGenerator labels={labels} />
                    <PaintingGenerator labels={labels} />
                    <BnWGenerator labels={labels} />
                </ToolSection>

                <ToolSection title="Restauração & Remoção">
                    <BackgroundReplacer labels={labels} />
                    <ImageColorizer labels={labels} />
                    <ImageRestorer labels={labels} />
                    <ObjectRemover labels={labels} />
                    <BackgroundBlur labels={labels} />
                    <ImageExpander labels={labels} />
                </ToolSection>

                <ToolSection title="Estética & Provador Virtual">
                    <ExpressionGenerator labels={labels} />
                    <VirtualFittingRoom labels={labels} />
                    <MixMatchTryOn labels={labels} />
                    <BodyShapeChanger labels={labels} />
                    <WigTryOn labels={labels} />
                </ToolSection>

                <ToolSection title="Design & Modelagem">
                    <SketchToImage labels={labels} />
                    <TextToImageGenerator labels={labels} />
                    <ThreeDObjectGenerator labels={labels} />
                    <LogoGenerator labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default PhotoTools;
