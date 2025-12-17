
import React from 'react';
import ToolSection from './ToolSection';
import InstagramTool from './InstagramTool';
import FacebookTool from './FacebookTool';
import TikTokTool from './TikTokTool';
import SocialMediaPlanner from './SocialMediaPlanner';

interface SocialMediaToolsProps {
    labels: any;
}

const SocialMediaTools: React.FC<SocialMediaToolsProps> = ({ labels }) => {
    return (
        <div className="max-w-5xl mx-auto pb-20">
            <header className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--text-main)]">Social Media & Analytics</h2>
                <p className="text-[var(--text-muted)] mt-2">Inteligência de mercado para redes sociais.</p>
            </header>
            <div className="space-y-6">
                <ToolSection title="Instagram Feed & AI" defaultOpen={true}>
                    <InstagramTool labels={labels} />
                </ToolSection>

                <ToolSection title="Facebook Feed & Analytics">
                    <FacebookTool labels={labels} />
                </ToolSection>

                <ToolSection title="TikTok Trends & Analysis">
                    <TikTokTool labels={labels} />
                </ToolSection>

                <ToolSection title="Content Planning">
                    <SocialMediaPlanner labels={labels} />
                </ToolSection>
            </div>
        </div>
    );
};

export default SocialMediaTools;
