import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position
} from 'reactflow';
import dagre from 'dagre';
import {
    FileText,
    Upload,
    Save,
    Wifi,
    Eye,
    Edit3,
    List,
    CheckCircle2,
    Clock,
    AlertCircle,
    Image as ImageIcon,
    Wand2,
    Share2,
    Github,
    GitBranch,
    Activity,
    RefreshCw
} from 'lucide-react';
import { DocState } from '../types';
import { geminiService } from '../services/geminiService';

// (Redundant interface removed)

interface Section {
    id: string;
    title: string;
    content: string;
    level: number;
    status: 'pending' | 'complete' | 'comment';
}

// --- DIAGRAM HELPERS ---
const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

// --- PARSERS ---
const parseFlowChart = (code: string) => {
    const lines = code.split('\n').filter(l => l.trim().length > 0);
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeSet = new Set();

    lines.forEach(line => {
        if (line.includes('-->')) {
            const [source, target] = line.split('-->').map(s => s.trim());
            const sId = source.replace(/\s+/g, '_');
            const tId = target.replace(/\s+/g, '_');

            if (!nodeSet.has(sId)) {
                nodes.push({ id: sId, data: { label: source }, position: { x: 0, y: 0 }, type: 'default' });
                nodeSet.add(sId);
            }
            if (!nodeSet.has(tId)) {
                nodes.push({ id: tId, data: { label: target }, position: { x: 0, y: 0 }, type: 'default' });
                nodeSet.add(tId);
            }
            edges.push({ id: `e${sId}-${tId}`, source: sId, target: tId, markerEnd: { type: MarkerType.ArrowClosed } });
        }
    });

    return getLayoutedElements(nodes, edges);
};

const parseMindMap = (code: string) => {
    const lines = code.split('\n');
    const nodes: any[] = [];
    const edges: any[] = [];
    const stack: { level: number, id: string }[] = [];
    let idCounter = 0;

    lines.forEach(line => {
        const trimmed = line.trimStart();
        if (!trimmed.startsWith('-')) return;

        const level = line.length - trimmed.length;
        const label = trimmed.replace('- ', '');
        const id = `node_${idCounter++}`;

        nodes.push({
            id,
            data: { label },
            position: { x: 0, y: 0 },
            style: { border: '1px solid #777', padding: 10, borderRadius: 5 }
        });

        // Current parent is the last one in stack with level < current level
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        if (stack.length > 0) {
            const parent = stack[stack.length - 1];
            edges.push({
                id: `e${parent.id}-${id}`,
                source: parent.id,
                target: id,
                type: 'smoothstep'
            });
        }

        stack.push({ level, id });
    });

    return { nodes, edges: edges.map(e => ({ ...e, animated: true })) }; // Simple mindmap layout would need more logic or just dagre
};


// --- HELPERS MAIN ---
const parseMarkdownToSections = (markdown: string): Section[] => {
    const lines = markdown.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let sectionIdCounter = 0;

    lines.forEach(line => {
        const h1Match = line.match(/^# (.*)/);
        const h2Match = line.match(/^## (.*)/);
        const h3Match = line.match(/^### (.*)/);

        if (h1Match || h2Match || h3Match) {
            if (currentSection) {
                sections.push(currentSection);
            }
            const title = h1Match ? h1Match[1] : (h2Match ? h2Match[1] : h3Match![1]);
            const level = h1Match ? 1 : (h2Match ? 2 : 3);
            currentSection = {
                id: `sec-${sectionIdCounter++}`,
                title: title.trim(),
                content: line + '\n',
                level,
                status: line.includes('[Pendiente]') ? 'pending' : 'complete'
            };
        } else {
            if (currentSection) {
                currentSection.content += line + '\n';
                // Detect comments
                if (line.trim().startsWith('[')) {
                    currentSection.status = 'pending';
                }
            } else {
                // Frontmatter or intro text
                if (!sections.length && line.trim()) {
                    currentSection = {
                        id: `sec-intro`,
                        title: "Introducción",
                        content: line + '\n',
                        level: 1,
                        status: 'complete'
                    };
                }
            }
        }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
};


// --- RENDERERS ---

const FlowRenderer = ({ code }: { code: string }) => {
    const { nodes, edges } = useMemo(() => parseFlowChart(code), [code]);
    const [nlpNodes, setNodes, onNodesChange] = useNodesState(nodes);
    const [nlpEdges, setEdges, onEdgesChange] = useEdgesState(edges);

    return (
        <div className="h-64 border border-slate-200 rounded-lg bg-slate-50 my-4 shadow-inner overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={12} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
};

const MindMapRenderer = ({ code }: { code: string }) => {
    // Simplified implementation for mindmap using dagre for now as parser above uses it implicitly by node structure
    // Just reuse simple layout or improve parser. Using dagre layout for list items as hierarchical tree.
    const { nodes, edges } = useMemo(() => {
        const result = parseMindMap(code);
        return getLayoutedElements(result.nodes, result.edges, 'LR');
    }, [code]);

    return (
        <div className="h-96 border border-slate-200 rounded-lg bg-white my-4 shadow-sm overflow-hidden">
            <div className="absolute top-2 left-2 z-10 bg-slate-100 px-2 py-1 rounded text-[10px] text-slate-500 font-bold uppercase">Mind Map</div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#f1f5f9" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    )
}

const TableRenderer = ({ markdownTable }: { markdownTable: string }) => {
    const rows = markdownTable.trim().split('\n').map(row =>
        row.split('|').filter((_, i, arr) => i !== 0 && i !== arr.length - 1).map(cell => cell.trim())
    );
    const headers = rows[0];
    const data = rows.slice(2); // Skip separator row

    return (
        <div className="overflow-x-auto my-4 rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        {headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            {row.map((cell, j) => <td key={j} className="px-4 py-3 border-r border-slate-50 last:border-none">{cell}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- INFOGRAPHICS ---
const InfographicGenerator = ({ sectionTitle }: { sectionTitle: string }) => {
    const [generating, setGenerating] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            // Mock generation or call service
            const url = await geminiService.generateInfographic(sectionTitle);
            if (url && !url.startsWith('http')) {
                // If it's pure base64/error handle it, but assuming service returns url or we use placeholder
                console.log("Infographic generation prompt sent.");
            }
            // For Demo purposes if service not fully hooked
            // setImageUrl("https://source.unsplash.com/random/800x600?tech"); 
            if (url) setImageUrl(url);

        } catch (e: any) {
            console.error("Gen failed", e);
            alert(`Error generando infografía: ${e.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="my-4">
            {!imageUrl ? (
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors w-full justify-center border border-violet-200 border-dashed"
                >
                    <Wand2 size={14} className={generating ? "animate-spin" : ""} />
                    {generating ? "Diseñando Infografía..." : "Generar Infografía IA"}
                </button>
            ) : (
                <div className="relative group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                    <img src={imageUrl} alt="Generated Infographic" className="w-full h-64 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button className="text-white hover:text-blue-200"><Eye size={24} /></button>
                        <button onClick={() => setImageUrl(null)} className="text-white hover:text-red-200"><Clock size={24} /></button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">Generado por Sora</div>
                </div>
            )}
        </div>
    )
}


const SectionContentRenderer = ({ content }: { content: string }) => {
    // Detect code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="text-slate-600 leading-relaxed space-y-4 font-normal">
            {parts.map((part, idx) => {
                if (part.startsWith('```')) {
                    const match = part.match(/```(\w+)?/);
                    const lang = match ? match[1] : '';
                    const clean = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');

                    if (lang === 'flow' || clean.includes('graph TD')) {
                        return <FlowRenderer key={idx} code={clean} />;
                    } else if (lang === 'mindmap' || clean.includes('mindmap')) {
                        return <MindMapRenderer key={idx} code={clean} />;
                    } else if (clean.trim().includes('|---') || (clean.trim().startsWith('|') && clean.includes('|'))) {
                        return <TableRenderer key={idx} markdownTable={clean} />;
                    }
                    else {
                        // PREMIUM CODE BLOCK (Mac/VSCode Style)
                        return (
                            <div key={idx} className="rounded-xl overflow-hidden shadow-2xl border border-slate-800/50 my-6 bg-[#0F0F0F] group hover:shadow-blue-500/10 transition-all duration-300">
                                <div className="bg-[#1A1A1A] p-2 px-4 flex items-center justify-between border-b border-white/5 select-none">
                                    <div className="flex gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] shadow-sm" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] shadow-sm" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] shadow-sm" />
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">{lang || 'PLAINTEXT'}</span>
                                </div>
                                <div className="relative">
                                    <pre className="bg-[#050505] text-blue-100 p-5 text-[13px] font-mono overflow-x-auto leading-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                        {clean}
                                    </pre>
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="text-[10px] text-slate-600 bg-white/5 px-2 py-1 rounded">ReadOnly</div>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                }

                // Enhanced Text Parsing & TABLE DETECTION
                // Split by potential table blocks (start with | and end with |)
                const textNodes = [];
                const tableRegex = /(\n\|.*\|(?:\n\|.*\|)+)/g;
                const subParts = part.split(tableRegex);

                subParts.forEach((subPart, subIdx) => {
                    const trimmedSub = subPart.trim();
                    if (trimmedSub.startsWith('|') && trimmedSub.includes('|') && trimmedSub.split('\n').length > 1) {
                        // It's a table!
                        textNodes.push(<TableRenderer key={`tbl-${subIdx}`} markdownTable={trimmedSub} />);
                        return;
                    }

                    // Standard Paragraph Parsing for non-table parts
                    const lines = subPart.split('\n');
                    lines.forEach((line, lIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) {
                            textNodes.push(<div key={`sp-${subIdx}-${lIdx}`} className="h-2" />);
                            return;
                        }
                        if (line.startsWith('#')) return; // Headers handled by parent

                        // List Items
                        if (line.startsWith('- ') || line.startsWith('* ')) {
                            textNodes.push(
                                <div key={`li-${subIdx}-${lIdx}`} className="flex gap-3 ml-2 items-start group/li">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 group-hover/li:bg-blue-300 transition-colors shrink-0" />
                                    <p className="text-slate-200/90 leading-7">{parseFormatting(line.replace(/^[-*] /, ''))}</p>
                                </div>
                            );
                            return;
                        }

                        // Alerts / Callouts
                        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                            const alertType = trimmed.includes('!') || trimmed.includes('ERROR') ? 'red' : 'amber';
                            const styles = alertType === 'red'
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30";

                            textNodes.push(
                                <div key={`al-${subIdx}-${lIdx}`} className={`${styles} px-4 py-3 rounded-lg border-l-4 text-sm font-medium my-3 flex gap-3 items-center backdrop-blur-sm`}>
                                    <AlertCircle size={16} />
                                    {trimmed.replace(/^\[|\]$/g, '')}
                                </div>
                            );
                            return;
                        }

                        // Standard Paragraph
                        textNodes.push(
                            <p key={`p-${subIdx}-${lIdx}`} className="text-slate-300 leading-7 mb-2">
                                {parseFormatting(line)}
                            </p>
                        );
                    });
                });

                return <div key={idx}>{textNodes}</div>;
            })}
        </div>
    );
};

// Simple formatter for Bold/Italic
const parseFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/);
    return parts.map((p, pIdx) => {
        if (p.startsWith('**')) return <strong key={pIdx} className="text-white font-bold tracking-tight">{p.replace(/\*\*/g, '')}</strong>;
        if (p.startsWith('`')) return <code key={pIdx} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded textxs font-mono border border-slate-700/50">{p.replace(/`/g, '')}</code>;
        return <span key={pIdx}>{p}</span>;
    });
};

interface EditorPanelProps {
    docState: {
        title: string;
        content: string;
    };
    setDocContent: (content: string) => void;
    setDocTitle: (title: string) => void;
    isTyping: boolean;
    isUpdating?: boolean;
    onSave: () => void;
    appLink: string;
    setAppLink: (link: string) => void;
    onShowHistory: () => void;
    availableDocs: string[];
    onLoadDocument: (title: string) => void;
    onNewDocument: () => void;
    showDocSelector: boolean;
    setShowDocSelector: (show: boolean) => void;
    onPushToGithub?: () => void;
    hasGithubRepo?: boolean;
    currentActivity?: string;
    onContextComment: (sectionTitle: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
    docState,
    setDocContent,
    setDocTitle,
    isTyping,
    onSave,
    appLink,
    setAppLink,
    onShowHistory,
    availableDocs,
    onLoadDocument,
    onNewDocument,
    showDocSelector,
    setShowDocSelector,
    onPushToGithub,
    hasGithubRepo,
    currentActivity,
    onContextComment
}) => {
    const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
    const [showToc, setShowToc] = useState(true);

    // Metrics Delta
    const [prevContentLength, setPrevContentLength] = useState(docState.content.length);
    const [lastDelta, setLastDelta] = useState(0);

    useEffect(() => {
        if (!isTyping && docState.content.length !== prevContentLength) {
            setLastDelta(docState.content.length - prevContentLength);
            setPrevContentLength(docState.content.length);
        }
    }, [docState.content, isTyping, prevContentLength]);

    const sections = useMemo(() => parseMarkdownToSections(docState.content), [docState.content]);

    const completionPercentage = useMemo(() => {
        if (sections.length === 0) return 0;
        const completed = sections.filter(s => s.status === 'complete').length;
        return Math.round((completed / sections.length) * 100);
    }, [sections]);

    const handleScrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.classList.add('bg-blue-50', 'transition-colors', 'duration-700');
            setTimeout(() => element.classList.remove('bg-blue-50'), 1500);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'complete': return <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase"><CheckCircle2 size={10} /> Completado</span>;
            case 'pending': return <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase"><Clock size={10} /> Pendiente</span>;
            case 'comment': return <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">Comentario</span>;
            default: return null;
        }
    };

    return (
        <div className="flex-1 grid grid-rows-[auto_1fr_auto] bg-[#f8f9fa] relative overflow-hidden h-full text-slate-800 font-sans min-w-0 min-h-0">

            {/* HEADER */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <button
                            onClick={() => setShowDocSelector(!showDocSelector)}
                            className="p-2 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                            title="Mis Documentos"
                        >
                            <FileText size={20} className="text-blue-600" />
                        </button>

                        {/* DROPDOWN DOC SELECTOR */}
                        {showDocSelector && (
                            <div className="absolute top-12 left-0 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
                                <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Mis Documentos</span>
                                    <button onClick={onNewDocument} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-bold">+ Nuevo</button>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {availableDocs.map((title, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onLoadDocument(title)}
                                            className="w-full text-left px-4 py-3 text-xs text-slate-700 hover:bg-blue-50 border-b border-slate-50 last:border-0 truncate transition-colors"
                                        >
                                            {title}
                                        </button>
                                    ))}
                                    {availableDocs.length === 0 && (
                                        <div className="p-4 text-center text-xs text-slate-400">No hay documentos recientes.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center gap-1">
                        <input
                            value={docState.title}
                            onChange={(e) => setDocTitle(e.target.value)}
                            className="bg-transparent text-lg font-bold text-slate-800 focus:outline-none focus:underline decoration-blue-500 underline-offset-4 w-96 placeholder:text-slate-400"
                            placeholder="Documento Sin Título"
                        />
                        {/* APP LINK INPUT */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 group">
                            <Share2 size={12} className="text-slate-400 group-focus-within:text-blue-500" />
                            <input
                                value={appLink}
                                onChange={(e) => setAppLink(e.target.value)}
                                placeholder="https://tu-app-desplegada.com..."
                                className="bg-transparent focus:outline-none w-64 text-slate-500 hover:text-blue-600 focus:text-blue-700 transition-colors placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* HISTORY BUTTON */}
                    <button
                        onClick={onShowHistory}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver Historial de Versiones"
                    >
                        <Clock size={18} />
                    </button>

                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Eye size={14} /> Vista Previa
                        </button>
                        <button
                            onClick={() => setViewMode('source')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'source' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Edit3 size={14} /> Código
                        </button>
                    </div>
                    {hasGithubRepo && (
                        <button
                            onClick={onPushToGithub}
                            className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all active:scale-95 border border-slate-700"
                            title="Push to GitHub"
                        >
                            <Github size={14} /> PUSH
                        </button>
                    )}
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <Save size={14} /> GUARDAR
                    </button>
                </div>
            </div>

            <div className="relative flex overflow-hidden min-h-0 bg-slate-50/50">

                {/* TOC */}
                <div className={`border-r border-slate-200 bg-white flex flex-col transition-all duration-300 ease-in-out ${showToc ? 'w-64' : 'w-0 opacity-0'}`}>
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tabla de Contenidos</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{sections.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {sections.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => handleScrollToSection(sec.id)}
                                className={`block w-full text-left text-xs py-1.5 px-2 rounded hover:bg-slate-50 truncate transition-colors ${sec.level === 1 ? 'font-bold text-slate-800' : 'pl-4 text-slate-600'}`}
                            >
                                {sec.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN DOCUMENT */}
                <div className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar min-h-0 pb-32">

                    <button
                        onClick={() => setShowToc(!showToc)}
                        className="absolute top-4 left-4 z-10 p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-500 rounded shadow-sm transition-colors"
                        title="Toggle Index"
                    >
                        <List size={16} />
                    </button>

                    {/* (Status moved to Footer) */}

                    <div className="max-w-[850px] mx-auto min-h-screen bg-white shadow-xl shadow-slate-200/50 my-8 px-12 py-16 transition-all">
                        {viewMode === 'source' ? (
                            <textarea
                                value={docState.content}
                                onChange={(e) => setDocContent(e.target.value)}
                                className="w-full h-full min-h-[800px] resize-none focus:outline-none font-mono text-sm leading-6 text-slate-600"
                                spellCheck="false"
                            />
                        ) : (
                            <div className="space-y-8">
                                {sections.map((section, idx) => (
                                    <div
                                        id={section.id}
                                        key={section.id}
                                        className={`
                                    relative pl-6 border-l-4 transition-all hover:bg-slate-50/50 rounded-r-lg p-2 group duration-500
                                    ${section.status === 'complete' ? 'border-emerald-400' : ''}
                                    ${section.status === 'pending' ? 'border-amber-400' : ''}
                                    ${section.status === 'comment' ? 'border-slate-300' : ''}
                                `}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            {section.level === 1 && <h1 className="text-3xl font-bold text-blue-900 border-b-2 border-blue-100 pb-2 w-full mt-8 mb-4">{section.title}</h1>}
                                            {section.level === 2 && <h2 className="text-xl font-bold text-slate-800 mt-6 flex items-center gap-3"><span className="text-slate-300 font-normal text-base">#{idx + 1}</span> {section.title}</h2>}
                                            {section.level >= 3 && <h3 className="text-md font-semibold text-slate-700 mt-4 uppercase tracking-wide">{section.title}</h3>}

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onContextComment(section.title)}
                                                    className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-100 rounded transition-colors"
                                                    title="Comentar sobre esta sección (+coment)"
                                                >
                                                    <Wand2 size={14} />
                                                </button>
                                                <StatusBadge status={section.status} />
                                            </div>
                                        </div>

                                        {/* Infographic Button per Section */}
                                        {section.level >= 2 && <InfographicGenerator sectionTitle={section.title} />}

                                        {/* Advanced Content Renderer */}
                                        <SectionContentRenderer content={section.content} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* STATUS BAR FOOTER (Enhanced Visor) */}
            <div className={`h-8 border-t border-white/10 flex items-center justify-between px-4 text-[11px] font-sans z-30 select-none transition-colors duration-300
                ${isTyping ? 'bg-indigo-600 animate-pulse' : 'bg-[#007acc]'} text-white`}>

                <div className="flex items-center gap-6">
                    {/* Activity Section */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-yellow-300 animate-ping' : 'bg-emerald-400 opacity-60'}`} />
                        <span className="font-bold tracking-tight uppercase opacity-90">
                            {isTyping ? 'IA OPERANDO' : 'SISTEMA LISTO'}
                        </span>
                    </div>

                    {/* Live Log */}
                    <div className="h-4 w-px bg-white/20 mx-1" />
                    <div className="flex items-center gap-2 max-w-[400px] truncate overflow-hidden">
                        <Activity size={12} className={isTyping ? 'text-yellow-200' : 'opacity-40'} />
                        <span className="italic opacity-80 whitespace-nowrap">
                            {currentActivity || (isTyping ? 'Analizando documento...' : 'Esperando comandos del arquitecto...')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-5 font-mono">
                    {/* Metrics Section */}
                    <div className="flex items-center gap-4 bg-black/10 px-3 py-1 rounded-sm border border-white/5">
                        <div className="flex items-center gap-1.5" title="Líneas">
                            <span className="opacity-50">LN:</span>
                            <span className="font-bold">{docState.content.split('\n').length}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Palabras">
                            <span className="opacity-50">W:</span>
                            <span className="font-bold">{docState.content.trim() ? docState.content.trim().split(/\s+/).length : 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Caracteres">
                            <span className="opacity-50">C:</span>
                            <span className="font-bold">{docState.content.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Tokens aproximados (Chars/4)">
                            <span className="opacity-50">TK:</span>
                            <span className="font-bold text-blue-200">{Math.ceil(docState.content.length / 4)}</span>
                        </div>

                        {/* DELTA VISUALIZER */}
                        {lastDelta !== 0 && (
                            <div className={`flex items-center gap-1 px-1.5 rounded text-[9px] font-black ${lastDelta > 0 ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'}`}>
                                {lastDelta > 0 ? '+' : ''}{lastDelta} CHARS
                            </div>
                        )}
                    </div>

                    {/* Environment Info */}
                    <div className="flex items-center gap-3 opacity-70">
                        <span className="hover:text-yellow-200 cursor-help transition-colors">UTF-8</span>
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold">MARKDOWN</span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-300">
                        <CheckCircle2 size={12} />
                        <span className="font-bold uppercase tracking-widest text-[9px]">Sincronizado</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default EditorPanel;