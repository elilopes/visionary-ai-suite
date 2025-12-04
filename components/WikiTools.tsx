
import React, { useState } from 'react';
import ToolSection from './ToolSection';
import WikitextConverter from './WikitextConverter';
import WikidataExtractor from './WikidataExtractor';
import SparqlGenerator from './SparqlGenerator';
import WikiStubGenerator from './WikiStubGenerator';
import WikiCitationFinder from './WikiCitationFinder';
import WikidataHelpModal from './WikidataHelpModal';

interface WikiToolsProps {
    labels: any;
}

const WikiTools: React.FC<WikiToolsProps> = ({ labels }) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <div className="max-w-5xl mx-auto">
            <header className="text-center mb-10">
                <div className="flex items-center justify-center gap-3">
                    <h2 className="text-3xl font-bold text-gray-200">{labels.title}</h2>
                    <button 
                        onClick={() => setIsHelpOpen(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors text-sm border border-gray-500"
                        title="Wikidata Help"
                    >
                        ?
                    </button>
                </div>
                <p className="text-gray-400 mt-2">{labels.description}</p>
            </header>
            <div className="space-y-6">
                <ToolSection title={labels.citationFinderTitle} defaultOpen={true}>
                    <WikiCitationFinder labels={labels} />
                </ToolSection>

                <ToolSection title={labels.wikitextTitle}>
                    <WikitextConverter labels={labels} />
                </ToolSection>

                <ToolSection title={labels.wikidataTitle}>
                    <WikidataExtractor labels={labels} />
                </ToolSection>

                <ToolSection title={labels.sparqlTitle}>
                    <SparqlGenerator labels={labels} />
                </ToolSection>

                <ToolSection title={labels.stubTitle}>
                    <WikiStubGenerator labels={labels} />
                </ToolSection>
            </div>

            <WikidataHelpModal 
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                labels={labels}
            />
        </div>
    );
};

export default WikiTools;
