
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
        <div className="max-w-5xl mx-auto">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-200">{labels.title}</h2>
                <p className="text-gray-400 mt-2">{labels.description}</p>
            </header>
            <div className="space-y-6">
                <ToolSection title={labels.videoDownloaderTitle} defaultOpen={true}>
                    <VideoDownloader labels={labels} />
                </ToolSection>

                <ToolSection title={labels.converterWasmTitle || "Client-Side Video Converter"}>
                    <VideoConverterWasm labels={labels} />
                </ToolSection>

                <ToolSection title={labels.audioVisualizerTitle}>
                    <AudioVisualizer labels={labels} />
                </ToolSection>

                <ToolSection title={labels.vocalRemoverTitle}>
                    <VocalRemover labels={labels} />
                </ToolSection>

                <ToolSection title={labels.avatarTalkerTitle}>
                    <AvatarTalker labels={labels} />
                </ToolSection>

                <ToolSection title={labels.cropperTitle}>
                    <VideoCropper labels={labels} />
                </ToolSection>

                <ToolSection title={labels.quoteVideoTitle}>
                    <QuoteToVideo labels={labels} />
                </ToolSection>

                <ToolSection title={labels.captionerTitle}>
                    <VideoCaptioner labels={labels} />
                </ToolSection>

                <ToolSection title={labels.transcriberTitle}>
                    <VideoTranscriber labels={labels} />
                </ToolSection>

                <ToolSection title={labels.ideatorTitle}>
                    <VideoIdeator labels={labels} />
                </ToolSection>

                <ToolSection title={labels.converterTitle}>
                    <VideoConverter labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default VideoTools;
