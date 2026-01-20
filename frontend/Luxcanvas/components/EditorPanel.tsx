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
  Share2
} from 'lucide-react';
import { DocState } from '../types';
import { geminiService } from '../services/geminiService';

interface EditorPanelProps {
  docState: DocState;
  setDocContent: (content: string) => void;
  setDocTitle: (title: string) => void;
  isTyping: boolean;
}

// --- DIAGRAM HELPERS (DAGRE LAYOUT) ---
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- CUSTOM NODES / PARSERS ---

// Parser for ```flow syntax
const parseFlowChart = (code: string) => {
  const lines = code.split('\n');
  const initialNodes: any[] = [];
  const initialEdges: any[] = [];
  const nodeMap = new Map();

  lines.forEach((line, idx) => {
    if(!line.includes('->')) return;
    const parts = line.split('->');
    const sourceRaw = parts[0].trim();
    const targetRaw = parts[1].trim();

    // Helper to process node labels
    const processNode = (raw: string) => {
      let label = raw;
      let type = 'default';
      
      if(raw.includes('[IN]')) { type = 'input'; label = raw.replace('[IN]', '').trim(); }
      if(raw.includes('[OUT]')) { type = 'output'; label = raw.replace('[OUT]', '').trim(); }
      if(raw.includes('?')) { type = 'decision'; } // Custom decision styling logic needed

      if(!nodeMap.has(label)) {
        const id = `node-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        nodeMap.set(label, id);
        
        let style: React.CSSProperties = { background: '#fff', border: '1px solid #777', padding: '10px', borderRadius: '5px', fontSize: '12px' };
        if(type === 'input') style = { ...style, background: '#dcfce7', borderColor: '#22c55e', color: '#14532d' };
        if(type === 'output') style = { ...style, background: '#ffedd5', borderColor: '#f97316', color: '#7c2d12' };
        if(type === 'decision') style = { ...style, background: '#fef9c3', borderColor: '#eab308', borderRadius: '50%' };
        if(type === 'default') style = { ...style, background: '#e0f2fe', borderColor: '#3b82f6', color: '#1e3a8a' };

        initialNodes.push({
          id,
          data: { label },
          position: { x: 0, y: 0 }, // Layout will fix this
          style
        });
      }
      return nodeMap.get(label);
    };

    const sourceId = processNode(sourceRaw);
    const targetId = processNode(targetRaw);

    initialEdges.push({
      id: `edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      markerEnd: { type: MarkerType.ArrowClosed },
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#64748b' }
    });
  });

  return getLayoutedElements(initialNodes, initialEdges, 'LR'); // Left to Right flow
};

// Parser for ```mindmap syntax
const parseMindMap = (code: string) => {
    const lines = code.split('\n').filter(l => l.trim() !== '');
    const nodes: any[] = [];
    const edges: any[] = [];
    const stack: { level: number, id: string }[] = [];

    lines.forEach((line, idx) => {
        const level = line.search(/\S/); // Count leading spaces
        const label = line.trim();
        const id = `mm-${idx}`;

        // Colors based on depth
        const colors = ['#f8fafc', '#eff6ff', '#f0fdf4', '#fefce8'];
        const borderColors = ['#94a3b8', '#3b82f6', '#22c55e', '#eab308'];
        const depth = Math.floor(level / 2);
        const colorIdx = Math.min(depth, 3);

        nodes.push({
            id,
            data: { label },
            position: { x: 0, y: 0 },
            style: { 
                background: colors[colorIdx], 
                border: `1px solid ${borderColors[colorIdx]}`, 
                borderRadius: '20px', 
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: depth === 0 ? 'bold' : 'normal'
            }
        });

        // Find parent
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        if (stack.length > 0) {
            const parentId = stack[stack.length - 1].id;
            edges.push({
                id: `e-${parentId}-${id}`,
                source: parentId,
                target: id,
                type: 'default',
                style: { stroke: '#cbd5e1' }
            });
        }

        stack.push({ level, id });
    });

    // Radial-ish layout using Dagre with a trick or just Tree TB
    return getLayoutedElements(nodes, edges, 'TB');
};


// --- RENDERER COMPONENTS ---

const FlowRenderer = ({ code }: { code: string }) => {
  const { nodes, edges } = useMemo(() => parseFlowChart(code), [code]);
  return (
    <div className="h-64 w-full border border-slate-200 rounded-lg bg-slate-50 mb-4 overflow-hidden">
        <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            fitView 
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
        >
            <Background color="#cbd5e1" gap={16} size={1} />
            <Controls showInteractive={false} className="scale-75 origin-bottom-right" />
        </ReactFlow>
    </div>
  );
};

const MindMapRenderer = ({ code }: { code: string }) => {
    const { nodes, edges } = useMemo(() => parseMindMap(code), [code]);
    return (
      <div className="h-64 w-full border border-slate-200 rounded-lg bg-slate-50 mb-4 overflow-hidden">
          <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              fitView 
              proOptions={{ hideAttribution: true }}
          >
              <Background color="#cbd5e1" gap={16} size={1} variant="dots" />
              <Controls showInteractive={false} className="scale-75 origin-bottom-right" />
          </ReactFlow>
      </div>
    );
  };

const TableRenderer = ({ lines }: { lines: string[] }) => {
    // Basic Markdown Table Parser
    const headers = lines[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
    const alignments = lines[1].split('|').filter(c => c.trim() !== '').map(c => {
        const trimmed = c.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left';
    });
    const rows = lines.slice(2).map(line => 
        line.split('|').filter(c => c.trim() !== '').map(c => c.trim())
    );

    return (
        <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} scope="col" className="px-6 py-3 font-bold tracking-wider">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="bg-white border-b border-slate-100 hover:bg-blue-50/50 transition-colors last:border-b-0">
                            {row.map((cell, cIdx) => (
                                <td key={cIdx} className={`px-6 py-4 ${alignments[cIdx] === 'center' ? 'text-center' : alignments[cIdx] === 'right' ? 'text-right' : 'text-left'}`}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const InfographicGenerator = ({ sectionTitle }: { sectionTitle: string }) => {
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const generate = async () => {
        setLoading(true);
        const result = await geminiService.generateInfographic(sectionTitle);
        if (result) setImageUrl(result);
        setLoading(false);
    };

    if (imageUrl) {
        return (
            <div className="my-4 relative group">
                <img src={imageUrl} alt="AI Infographic" className="w-full rounded-lg shadow-md border border-slate-200" />
                <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-all">
                    ✕
                </button>
            </div>
        );
    }

    return (
        <button 
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 text-[10px] text-blue-500 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-all mb-4 disabled:opacity-50"
        >
            {loading ? <Wand2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            {loading ? 'Generando Infografía...' : 'Generar Infografía AI'}
        </button>
    );
};


// --- MAIN PARSER & RENDERER LOGIC ---

interface Section {
  id: string;
  title: string;
  level: number;
  content: string[]; // Raw content lines
  status: 'complete' | 'pending' | 'comment';
}

const parseMarkdownToSections = (text: string): Section[] => {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  lines.forEach((line, index) => {
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      if (currentSection) sections.push(currentSection);
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const id = `section-${slug}-${index}`;
      currentSection = { id, title, level, content: [], status: 'complete' };
    } else {
      if (!currentSection) {
        if (line.trim() !== '') {
          currentSection = { id: 'intro', title: 'Introducción', level: 2, content: [], status: 'complete' };
          currentSection.content.push(line);
        }
      } else {
        currentSection.content.push(line);
        if (line.includes('TBD') || line.includes('[Pendiente]') || line.includes('TODO')) currentSection.status = 'pending';
        if (line.trim().startsWith('<!--')) currentSection.status = 'comment';
      }
    }
  });

  if (currentSection) sections.push(currentSection);
  return sections;
};

// Component to render the content lines with block detection (Table, Code, Text)
const SectionContentRenderer = ({ content }: { content: string[] }) => {
    const renderedBlocks: React.ReactNode[] = [];
    let i = 0;

    while (i < content.length) {
        const line = content[i];
        
        // 1. Detect Tables (Look for pipes)
        if (line.trim().startsWith('|')) {
            const tableLines: string[] = [];
            while(i < content.length && content[i].trim().startsWith('|')) {
                tableLines.push(content[i]);
                i++;
            }
            renderedBlocks.push(<TableRenderer key={`table-${i}`} lines={tableLines} />);
            continue;
        }

        // 2. Detect Code Blocks (Flow, Mindmap, or Generic)
        if (line.trim().startsWith('```')) {
            const type = line.replace('```', '').trim();
            const codeLines: string[] = [];
            i++; // skip start
            while(i < content.length && !content[i].trim().startsWith('```')) {
                codeLines.push(content[i]);
                i++;
            }
            i++; // skip end
            const code = codeLines.join('\n');

            if (type === 'flow') {
                renderedBlocks.push(<FlowRenderer key={`flow-${i}`} code={code} />);
            } else if (type === 'mindmap') {
                renderedBlocks.push(<MindMapRenderer key={`mm-${i}`} code={code} />);
            } else {
                renderedBlocks.push(
                    <div key={`code-${i}`} className="bg-slate-800 text-slate-200 p-4 rounded-md font-mono text-xs overflow-x-auto mb-4">
                        <pre>{code}</pre>
                    </div>
                );
            }
            continue;
        }

        // 3. Normal Text (Paragraphs, Lists, Bold)
        // Group consecutive text lines
        const isList = line.trim().startsWith('-');
        
        renderedBlocks.push(
            <div key={`line-${i}`} className={`text-sm leading-7 text-slate-600 ${isList ? 'pl-4 relative' : 'mb-2'}`}>
                {isList && <span className="absolute left-0 top-2.5 w-1 h-1 bg-slate-400 rounded-full"></span>}
                {line.split(/(\*\*.*?\*\*)/).map((part, pIdx) => 
                    part.startsWith('**') && part.endsWith('**') 
                        ? <strong key={pIdx} className="text-slate-800 font-semibold">{part.slice(2, -2)}</strong> 
                        : part
                )}
            </div>
        );
        i++;
    }

    return <>{renderedBlocks}</>;
};

const EditorPanel: React.FC<EditorPanelProps> = ({ 
  docState, 
  setDocContent, 
  setDocTitle,
  isTyping
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
  const [showToc, setShowToc] = useState(true);

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
    <div className="flex-1 flex flex-col bg-[#f8f9fa] relative overflow-hidden h-full text-slate-800 font-sans">
        
      {/* HEADER */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-6">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex flex-col justify-center">
              <input 
                value={docState.title}
                onChange={(e) => setDocTitle(e.target.value)}
                className="bg-transparent text-lg font-bold text-slate-800 focus:outline-none focus:underline decoration-blue-500 underline-offset-4 w-96 placeholder:text-slate-400"
                placeholder="Documento Sin Título"
              />
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-600 uppercase tracking-wider">
                    {completionPercentage === 100 ? 'FINAL' : 'BORRADOR'}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="font-mono">Última edición: {new Date(docState.lastUpdated).toLocaleTimeString()}</span>
              </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
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
            <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 transition-all">
              <Save size={14} /> CONFIRMAR
            </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        
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
        <div className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar">
            
            <button 
                onClick={() => setShowToc(!showToc)}
                className="absolute top-4 left-4 z-10 p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-500 rounded shadow-sm transition-colors"
                title="Toggle Index"
            >
                <List size={16} />
            </button>

            {/* AI STATUS */}
            <div className="absolute top-4 right-8 flex flex-col items-end gap-2 pointer-events-none z-30">
                <div className="bg-white/90 backdrop-blur border border-blue-100 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-slate-200/50">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 tracking-wider">SINCRONIZACIÓN_GEMINI: {isTyping ? 'ESCRIBIENDO' : 'LISTO'}</span>
                </div>
            </div>

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
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="h-20"></div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="h-8 bg-slate-800 text-slate-400 flex items-center justify-between px-4 text-[10px] font-sans z-20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300"><Wifi size={10} className="text-emerald-500"/> CONECTADO</span>
            <span>utf-8</span>
            <span>markdown+flow</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{docState.content.split('\n').length} líneas</span>
            <span>{docState.content.length} caracteres</span>
            <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${completionPercentage}%` }}></div>
                </div>
                <span>{completionPercentage}% Completado</span>
            </div>
          </div>
      </div>

    </div>
  );
};

export default EditorPanel;