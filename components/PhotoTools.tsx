
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

interface PhotoToolsProps {
    labels: any;
}

const PhotoTools: React.FC<PhotoToolsProps> = ({ labels }) => {
    return (
        <div className="max-w-5xl mx-auto">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-200">{labels.photoTitle}</h2>
            </header>
            <div className="space-y-6">
                <ToolSection title="Augmented Reality & Real-Time" defaultOpen={true}>
                    <ArFilters labels={labels} />
                </ToolSection>

                <ToolSection title="Manual Editing & Distortion">
                    <LiquifyEditor labels={labels} />
                </ToolSection>

                <ToolSection title="Audio-Visual Synesthesia">
                    <ImageSonifier labels={labels} />
                </ToolSection>

                <ToolSection title="Analysis & Description">
                    <ImageAnalyzer labels={labels} />
                    <ColorPaletteExtractor labels={labels} />
                </ToolSection>

                <ToolSection title="Creative Storytelling">
                    <StorybookGenerator labels={labels} />
                    <VisualStoryteller labels={labels} />
                    <ImageCaptionGenerator labels={labels} />
                </ToolSection>

                <ToolSection title="Style Transformation">
                    <StyleTransformer labels={labels} />
                    <ThreeDPhotoGenerator labels={labels} />
                    <DollHolderGenerator labels={labels} />
                    <CartoonGenerator labels={labels} />
                    <DollGenerator labels={labels} />
                    <PaintingGenerator labels={labels} />
                    <BnWGenerator labels={labels} />
                </ToolSection>

                <ToolSection title="Restoration & Enhancement">
                    <BackgroundReplacer labels={labels} />
                    <ImageColorizer labels={labels} />
                    <ImageRestorer labels={labels} />
                    <ObjectRemover labels={labels} />
                    <BackgroundBlur labels={labels} />
                    <ImageExpander labels={labels} />
                </ToolSection>

                <ToolSection title="Virtual Try-On & Body">
                    <ExpressionGenerator labels={labels} />
                    <VirtualFittingRoom labels={labels} />
                    <MixMatchTryOn labels={labels} />
                    <BodyShapeChanger labels={labels} />
                    <WigTryOn labels={labels} />
                </ToolSection>

                <ToolSection title="Creation & Design">
                    <TextToImageGenerator labels={labels} />
                    <ThreeDObjectGenerator labels={labels} />
                    <LogoGenerator labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default PhotoTools;
