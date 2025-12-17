
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

    // Segurança: Fallbacks para evitar campos vazios se o idioma não estiver completo
    const l = {
        title: labels.title || "Wiki Research",
        description: labels.description || "Ferramentas de pesquisa.",
        citationFinderTitle: labels.citationFinderTitle || "Citation Validator",
        wikitextTitle: labels.wikitextTitle || "Wikitext Converter",
        wikidataTitle: labels.wikidataTitle || "Wikidata Extractor",
        sparqlTitle: labels.sparqlTitle || "SPARQL Generator",
        stubTitle: labels.stubTitle || "Stub Generator"
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <header className="text-center mb-10">
                <div className="flex items-center justify-center gap-3">
                    <h2 className="text-3xl font-bold text-[var(--text-main)]">{l.title}</h2>
                    <button 
                        onClick={() => setIsHelpOpen(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-panel)] hover:bg-[var(--bg-input)] text-[var(--text-main)] font-bold transition-colors text-sm border border-[var(--border-main)]"
                        title="Wikidata Help"
                    >
                        ?
                    </button>
                </div>
                <p className="text-[var(--text-muted)] mt-2">{l.description}</p>
            </header>
            <div className="space-y-6">
                <ToolSection title={l.citationFinderTitle} defaultOpen={true}>
                    <WikiCitationFinder labels={labels} />
                </ToolSection>

                <ToolSection title={l.wikitextTitle}>
                    <WikitextConverter labels={labels} />
                </ToolSection>

                <ToolSection title={l.wikidataTitle}>
                    <WikidataExtractor labels={labels} />
                </ToolSection>

                <ToolSection title={l.sparqlTitle}>
                    <SparqlGenerator labels={labels} />
                </ToolSection>

                <ToolSection title={l.stubTitle}>
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
