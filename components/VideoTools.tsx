
import React from 'react';
import ToolSection from './ToolSection';
import VideoCaptioner from './VideoCaptioner';
import VideoTranscriber from './VideoTranscriber';
import VideoIdeator from './VideoIdeator';
import VideoConverter from './VideoConverter';
import VideoCropper from './VideoCropper';
import QuoteToVideo from './QuoteToVideo';
import AvatarTalker from './AvatarTalker';
import VideoDownloader from './VideoDownloader';
import VocalRemover from './VocalRemover';
import AudioVisualizer from './AudioVisualizer';
import VideoConverterWasm from './VideoConverterWasm';

interface VideoToolsProps {
    labels: any;
}

const VideoTools: React.FC<VideoToolsProps> = ({ labels }) => {
    return (
        <div className="max-w-5xl mx-auto pb-20">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-main)]">{labels.title || "Video Suite"}</h2>
                <p className="text-[var(--text-muted)] mt-2">{labels.description || "Suíte profissional de vídeo."}</p>
            </header>
            <div className="space-y-6">
                <ToolSection title={labels.videoDownloaderTitle || "Downloader"} defaultOpen={true}>
                    <VideoDownloader labels={labels} />
                </ToolSection>

                <ToolSection title={labels.converterWasmTitle || "Conversor Local"}>
                    <VideoConverterWasm labels={labels} />
                </ToolSection>

                <ToolSection title={labels.audioVisualizerTitle || "Visualizador Áudio"}>
                    <AudioVisualizer labels={labels} />
                </ToolSection>

                <ToolSection title={labels.vocalRemoverTitle || "Remover Vocais"}>
                    <VocalRemover labels={labels} />
                </ToolSection>

                <ToolSection title={labels.avatarTalkerTitle || "Avatar Falante"}>
                    <AvatarTalker labels={labels} />
                </ToolSection>

                <ToolSection title={labels.cropperTitle || "Recortar Vídeo"}>
                    <VideoCropper labels={labels} />
                </ToolSection>

                <ToolSection title={labels.quoteVideoTitle || "Citação em Vídeo"}>
                    <QuoteToVideo labels={labels} />
                </ToolSection>

                <ToolSection title={labels.captionerTitle || "Legendas"}>
                    <VideoCaptioner labels={labels} />
                </ToolSection>

                <ToolSection title={labels.transcriberTitle || "Transcrição"}>
                    <VideoTranscriber labels={labels} />
                </ToolSection>

                <ToolSection title={labels.ideatorTitle || "Ideias IA"}>
                    <VideoIdeator labels={labels} />
                </ToolSection>

                <ToolSection title={labels.converterTitle || "Converter Script"}>
                    <VideoConverter labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default VideoTools;
