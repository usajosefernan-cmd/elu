import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    MarkerType,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { getSupabaseClient } from '../../../../services/authService';

interface DependencyGraphProps {
    docId: string;
    onClose?: () => void;
}

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

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
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const isHorizontal = false;

export const DependencyGraph: React.FC<DependencyGraphProps> = ({ docId, onClose }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const loadGraphData = useCallback(async () => {
        console.log("🕸️ Loading Dependency Graph for:", docId);
        const supabase = getSupabaseClient();

        // 1. Fetch Sections (Nodes)
        const { data: sections, error: secError } = await supabase
            .from('document_sections')
            .select('id, section_title, needs_review, review_reason')
            .eq('document_id', docId);

        if (secError || !sections) {
            console.error("Error loading sections for graph", secError);
            return;
        }

        // 2. Fetch Dependencies (Edges)
        // We need to fetch dependencies where source OR target is in our document sections
        // Ideally we filter by docId if we had it denormalized, but here we can rely on section IDs
        const sectionIds = sections.map(s => s.id);

        // Note: This query assumes dependencies are only internal to the doc. 
        // If we have cross-doc dependencies, we might need a broader query.
        const { data: dependencies, error: depError } = await supabase
            .from('section_dependencies')
            .select('*')
            .in('section_id', sectionIds);

        if (depError) {
            console.error("Error loading dependencies", depError);
        }

        // 3. Transform to React Flow
        const initialNodes: Node[] = sections.map((sec) => ({
            id: sec.id,
            data: {
                label: sec.section_title + (sec.needs_review ? ' ⚠️' : ''),
                original: sec
            },
            position: { x: 0, y: 0 }, // layout will fix this
            style: {
                border: sec.needs_review ? '2px solid #eab308' : '1px solid #777',
                background: sec.needs_review ? '#fefce8' : '#fff',
                color: '#333',
                fontSize: '12px',
                width: 170
            },
        }));

        const initialEdges: Edge[] = (dependencies || []).map((dep) => ({
            id: dep.id,
            source: dep.section_id,
            target: dep.depends_on_section_id,
            animated: true,
            label: dep.dependency_type || 'relates',
            style: { stroke: '#94a3b8' },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#94a3b8',
            },
        }));

        // 4. Calculate Layout
        // @ts-ignore
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

    }, [docId, setNodes, setEdges]);

    useEffect(() => {
        loadGraphData();
    }, [loadGraphData]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="w-full h-[600px] bg-slate-50 border rounded-lg shadow-inner relative">
            <div className="absolute top-2 left-2 z-10 bg-white/80 p-2 rounded text-xs font-mono">
                Dependency Graph (Auto-Layout)
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs"
                >
                    Close Graph
                </button>
            )}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
};
