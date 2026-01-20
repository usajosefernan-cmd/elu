/**
 * ADMIN GOD MODE - Gestor de Tablas de Prompt Rules
 * Nano Banana Pro v15 - DYNAMIC SCHEMA + REALTIME SYNC
 * 
 * Lee dinámicamente el schema de Supabase, detecta relaciones (edges),
 * y mantiene sincronización bidireccional en tiempo real.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient, supabaseUrl } from '../../services/authService';
import {
    Database, Save, RefreshCw, Loader2, ChevronDown, ChevronRight,
    Eye, Zap, Palette, Sun, Box, Target, Settings, AlertTriangle,
    Plus, Trash2, Edit3, Check, X, GitBranch, Network, Table2,
    ArrowRight, Link2, Radio, Activity
} from 'lucide-react';

// ============================================================================
// TABLAS v15 QUE GESTIONA ESTE ADMIN
// ============================================================================

const V15_TABLES = [
    'photoscaler_prompt_rules',
    'lightscaler_prompt_rules',
    'stylescaler_prompt_rules',
    'semantic_material_rules',
    'vision_trigger_overrides',
    'global_prompt_config',
    'prompt_audit_log'
];

// Mapeo de iconos por tabla
const TABLE_ICONS: Record<string, React.ReactNode> = {
    photoscaler_prompt_rules: <Eye className="w-4 h-4" />,
    lightscaler_prompt_rules: <Sun className="w-4 h-4" />,
    stylescaler_prompt_rules: <Palette className="w-4 h-4" />,
    semantic_material_rules: <Box className="w-4 h-4" />,
    vision_trigger_overrides: <Target className="w-4 h-4" />,
    global_prompt_config: <Settings className="w-4 h-4" />,
    prompt_audit_log: <Database className="w-4 h-4" />,
};

// Nombres amigables
const TABLE_DISPLAY_NAMES: Record<string, string> = {
    photoscaler_prompt_rules: 'PhotoScaler (Geometría)',
    lightscaler_prompt_rules: 'LightScaler (Luz)',
    stylescaler_prompt_rules: 'StyleScaler (Arte)',
    semantic_material_rules: 'Materiales PBR',
    vision_trigger_overrides: 'Vision Triggers',
    global_prompt_config: 'Config Global',
    prompt_audit_log: 'Audit Log',
};

// ============================================================================
// TIPOS DINÁMICOS
// ============================================================================

interface DynamicColumn {
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
}

interface TableSchema {
    table_name: string;
    columns: DynamicColumn[];
    rowCount: number;
}

interface TableEdge {
    source: string;
    target: string;
    relation: string;
}

// ============================================================================
// HELPER: Detectar tipo de editor según columna
// ============================================================================

const getEditorType = (columnName: string, dataType: string): 'input' | 'textarea' | 'slider' | 'checkbox' | 'json' => {
    const name = columnName.toLowerCase();
    const type = dataType.toLowerCase();

    // Prompts largos → textarea
    if (name.includes('prompt') || name.includes('logic') || name.includes('protocol') ||
        name.includes('statement') || name.includes('specs') || name.includes('description') ||
        name.includes('header') || name.includes('grading') || name.includes('atmosphere')) {
        return 'textarea';
    }

    if (type === 'jsonb' || type === 'json') return 'json';
    if (type === 'boolean' || type === 'bool') return 'checkbox';

    if ((type.includes('int') || type.includes('float') || type.includes('numeric')) &&
        (name.includes('value') || name.includes('scale') || name.includes('weight') ||
            name.includes('priority') || name.includes('density') || name.includes('min') || name.includes('max'))) {
        return 'slider';
    }

    return 'input';
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AdminGodMode: React.FC = () => {
    const supabase = getSupabaseClient();

    // State
    const [selectedTable, setSelectedTable] = useState<string>(V15_TABLES[0]);
    const [schemas, setSchemas] = useState<Record<string, TableSchema>>({});
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
    const [realtimeStatus, setRealtimeStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [view, setView] = useState<'tables' | 'edges'>('tables');

    // Edges dinámicos desde vision_trigger_overrides
    const [dynamicEdges, setDynamicEdges] = useState<TableEdge[]>([]);
    const [edgesLoading, setEdgesLoading] = useState(false);
    const [newEdge, setNewEdge] = useState<{ source: string; target: string; relation: string }>({
        source: 'vision_trigger_overrides',
        target: 'photoscaler_prompt_rules',
        relation: 'Fuerza slider'
    });

    // Edges base del sistema (siempre presentes)
    const systemEdges: TableEdge[] = useMemo(() => [
        { source: 'semantic_material_rules', target: 'ALL', relation: 'Inyecta prompts PBR' },
        { source: 'global_prompt_config', target: 'ALL', relation: 'Concatena siempre' },
    ], []);

    // ============================================================================
    // EDGES CRUD - Cargar/Crear/Eliminar edges desde vision_trigger_overrides
    // ============================================================================

    const fetchEdges = useCallback(async () => {
        setEdgesLoading(true);
        try {
            const { data, error } = await supabase
                .from('vision_trigger_overrides')
                .select('*')
                .order('id');

            if (error) throw error;

            // Convertir registros a formato TableEdge
            const loadedEdges: TableEdge[] = (data || []).map(row => ({
                source: 'vision_trigger_overrides',
                target: row.target_table || 'photoscaler_prompt_rules',
                relation: `${row.json_value_match} → Slider ${row.forced_slider_value}`,
            }));

            setDynamicEdges(loadedEdges);
        } catch (err) {
            console.error('Error fetching edges:', err);
        } finally {
            setEdgesLoading(false);
        }
    }, [supabase]);

    const createEdge = async () => {
        try {
            const { error } = await supabase
                .from('vision_trigger_overrides')
                .insert({
                    json_value_match: newEdge.relation.split(' → ')[0] || 'NEW_TRIGGER',
                    target_table: newEdge.target,
                    target_slider: 'acutancia',
                    forced_slider_value: 8,
                    is_active: true
                });

            if (error) throw error;
            await fetchEdges();
            setNewEdge({ source: 'vision_trigger_overrides', target: 'photoscaler_prompt_rules', relation: 'Fuerza slider' });
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const deleteEdge = async (index: number) => {
        if (!confirm('¿Eliminar este edge?')) return;

        try {
            // Obtener el registro correspondiente
            const { data: edges } = await supabase
                .from('vision_trigger_overrides')
                .select('id')
                .order('id');

            if (edges && edges[index]) {
                const { error } = await supabase
                    .from('vision_trigger_overrides')
                    .delete()
                    .eq('id', edges[index].id);

                if (error) throw error;
                await fetchEdges();
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    // Cargar edges al montar
    useEffect(() => {
        if (view === 'edges') {
            fetchEdges();
        }
    }, [view, fetchEdges]);

    // ============================================================================
    // SCHEMA INTROSPECTION - Lee estructura de tablas desde Supabase
    // ============================================================================

    const fetchSchemas = useCallback(async () => {
        const newSchemas: Record<string, TableSchema> = {};

        for (const tableName of V15_TABLES) {
            try {
                // Obtener columnas via SQL directo (requires service role or RLS bypass)
                const { data: columns, error: colError } = await supabase.rpc('get_table_columns', {
                    p_table_name: tableName
                }).single();

                // Fallback: Obtener una fila para inferir columnas
                if (colError || !columns) {
                    const { data: sampleRow } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1)
                        .single();

                    if (sampleRow) {
                        const inferredColumns: DynamicColumn[] = Object.keys(sampleRow).map(key => ({
                            column_name: key,
                            data_type: typeof sampleRow[key] === 'number' ? 'integer' :
                                typeof sampleRow[key] === 'boolean' ? 'boolean' : 'text',
                            is_nullable: 'YES',
                            column_default: null
                        }));

                        // Obtener conteo
                        const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

                        newSchemas[tableName] = {
                            table_name: tableName,
                            columns: inferredColumns,
                            rowCount: count || 0
                        };
                    }
                }
            } catch (err) {
                console.error(`Error fetching schema for ${tableName}:`, err);
            }
        }

        setSchemas(newSchemas);
    }, [supabase]);

    // ============================================================================
    // DATA FETCHING
    // ============================================================================

    const fetchTableData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(selectedTable)
                .select('*')
                .order('id');

            if (error) throw error;
            setTableData(data || []);
            setLastSync(new Date());
        } catch (err: any) {
            console.error('Error fetching table:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase, selectedTable]);

    // ============================================================================
    // REALTIME SUBSCRIPTION
    // ============================================================================

    useEffect(() => {
        // Establecer subscripción realtime
        setRealtimeStatus('connecting');

        const channel = supabase
            .channel(`admin-${selectedTable}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: selectedTable },
                (payload) => {
                    console.log('[Realtime] Change detected:', payload);

                    if (payload.eventType === 'INSERT') {
                        setTableData(prev => [...prev, payload.new]);
                    } else if (payload.eventType === 'UPDATE') {
                        setTableData(prev => prev.map(row =>
                            row.id === payload.new.id ? payload.new : row
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setTableData(prev => prev.filter(row => row.id !== payload.old.id));
                    }

                    setLastSync(new Date());
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Status:', status);
                setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
            });

        // Cleanup
        return () => {
            supabase.removeChannel(channel);
            setRealtimeStatus('disconnected');
        };
    }, [supabase, selectedTable]);

    // Initial fetch
    useEffect(() => {
        fetchSchemas();
    }, [fetchSchemas]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    // ============================================================================
    // CRUD OPERATIONS
    // ============================================================================

    const handleCellChange = (rowId: string, column: string, value: any) => {
        setPendingChanges(prev => ({
            ...prev,
            [rowId]: { ...prev[rowId], [column]: value }
        }));
    };

    const saveChanges = async () => {
        if (Object.keys(pendingChanges).length === 0) return;

        setSaving(true);
        try {
            for (const [rowId, changes] of Object.entries(pendingChanges)) {
                const { error } = await supabase
                    .from(selectedTable)
                    .update(changes)
                    .eq('id', rowId);

                if (error) throw error;
            }

            setPendingChanges({});
            // Realtime actualizará automáticamente
        } catch (err: any) {
            console.error('Error saving:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const deleteRow = async (rowId: string) => {
        if (!confirm('¿Eliminar este registro?')) return;

        try {
            const { error } = await supabase
                .from(selectedTable)
                .delete()
                .eq('id', rowId);

            if (error) throw error;
            // Realtime actualizará automáticamente
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const createRow = async () => {
        try {
            const { error } = await supabase
                .from(selectedTable)
                .insert({});

            if (error) throw error;
            // Realtime actualizará automáticamente
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    // ============================================================================
    // CELL EDITOR RENDERER
    // ============================================================================

    const renderCellEditor = (row: any, columnName: string, dataType: string) => {
        const value = pendingChanges[row.id]?.[columnName] ?? row[columnName];
        const editorType = getEditorType(columnName, dataType);

        if (editorType === 'textarea') {
            return (
                <div className="space-y-1">
                    <textarea
                        className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-xs font-mono resize-y min-h-[80px]"
                        value={value || ''}
                        onChange={(e) => handleCellChange(row.id, columnName, e.target.value)}
                    />
                    <div className="text-[10px] text-neutral-500">{value?.length || 0} chars</div>
                </div>
            );
        }

        if (editorType === 'slider') {
            const isFloat = dataType.includes('float') || dataType.includes('numeric');
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={0}
                        max={isFloat ? 1 : 20}
                        step={isFloat ? 0.1 : 1}
                        value={value || 0}
                        onChange={(e) => handleCellChange(row.id, columnName, parseFloat(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-sm font-mono w-10 text-right">{value}</span>
                </div>
            );
        }

        if (editorType === 'checkbox') {
            return (
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => handleCellChange(row.id, columnName, e.target.checked)}
                    className="w-5 h-5"
                />
            );
        }

        if (editorType === 'json') {
            return (
                <textarea
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-xs font-mono resize-y min-h-[60px]"
                    value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
                    onChange={(e) => {
                        try {
                            handleCellChange(row.id, columnName, JSON.parse(e.target.value));
                        } catch {
                            handleCellChange(row.id, columnName, e.target.value);
                        }
                    }}
                />
            );
        }

        return (
            <input
                type="text"
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm"
                value={value || ''}
                onChange={(e) => handleCellChange(row.id, columnName, e.target.value)}
            />
        );
    };

    // ============================================================================
    // RENDER
    // ============================================================================

    const currentSchema = schemas[selectedTable];

    return (
        <div className="h-full flex bg-neutral-950 text-white">
            {/* Sidebar */}
            <div className="w-56 border-r border-neutral-800 p-4 space-y-2 flex flex-col">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    God Mode v15
                </h2>

                {/* View Toggle */}
                <div className="flex gap-1 mb-4">
                    <button
                        onClick={() => setView('tables')}
                        className={`flex-1 py-1 text-xs rounded ${view === 'tables' ? 'bg-violet-600' : 'bg-neutral-800'}`}
                    >
                        Tablas
                    </button>
                    <button
                        onClick={() => setView('edges')}
                        className={`flex-1 py-1 text-xs rounded ${view === 'edges' ? 'bg-violet-600' : 'bg-neutral-800'}`}
                    >
                        Edges
                    </button>
                </div>

                {/* Table List */}
                <div className="flex-1 overflow-auto space-y-1">
                    {V15_TABLES.map(table => (
                        <button
                            key={table}
                            onClick={() => setSelectedTable(table)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${selectedTable === table
                                ? 'bg-violet-600 text-white'
                                : 'hover:bg-neutral-800 text-neutral-400'
                                }`}
                        >
                            {TABLE_ICONS[table]}
                            <span className="truncate">{TABLE_DISPLAY_NAMES[table]}</span>
                            {schemas[table] && (
                                <span className="ml-auto text-[10px] opacity-60">{schemas[table].rowCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Realtime Status */}
                <div className={`flex items-center gap-2 text-xs p-2 rounded ${realtimeStatus === 'connected' ? 'bg-green-900/30 text-green-400' :
                    realtimeStatus === 'connecting' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                    }`}>
                    <Radio className={`w-3 h-3 ${realtimeStatus === 'connecting' ? 'animate-pulse' : ''}`} />
                    {realtimeStatus === 'connected' ? 'Sincronizado' :
                        realtimeStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            {TABLE_ICONS[selectedTable]}
                            {TABLE_DISPLAY_NAMES[selectedTable]}
                        </h1>
                        {lastSync && (
                            <p className="text-xs text-neutral-500">
                                Última sync: {lastSync.toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={createRow}
                            className="flex items-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo
                        </button>

                        <button
                            onClick={fetchTableData}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        <button
                            onClick={saveChanges}
                            disabled={saving || Object.keys(pendingChanges).length === 0}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium ${Object.keys(pendingChanges).length > 0
                                ? 'bg-green-600 hover:bg-green-500'
                                : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                }`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar ({Object.keys(pendingChanges).length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {view === 'edges' ? (
                        /* Edges View - EDITABLE */
                        <div className="space-y-6">
                            {/* Header con Refresh */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-neutral-400">Vision Trigger Edges (Editables)</h3>
                                <button
                                    onClick={fetchEdges}
                                    disabled={edgesLoading}
                                    className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs"
                                >
                                    <RefreshCw className={`w-3 h-3 ${edgesLoading ? 'animate-spin' : ''}`} />
                                    Actualizar
                                </button>
                            </div>

                            {/* Edges dinámicos desde vision_trigger_overrides */}
                            {edgesLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {dynamicEdges.map((edge, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-neutral-900 border border-violet-500/30 rounded-lg group">
                                            <div className="flex items-center gap-2">
                                                {TABLE_ICONS[edge.source]}
                                                <span className="text-sm">{TABLE_DISPLAY_NAMES[edge.source]}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-violet-500" />
                                            <div className="flex items-center gap-2">
                                                {TABLE_ICONS[edge.target] || <Network className="w-4 h-4" />}
                                                <span className="text-sm">{TABLE_DISPLAY_NAMES[edge.target] || edge.target}</span>
                                            </div>
                                            <span className="ml-auto text-xs text-violet-400 font-mono">{edge.relation}</span>
                                            <button
                                                onClick={() => deleteEdge(i)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/50 rounded text-red-400 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {dynamicEdges.length === 0 && (
                                        <p className="text-neutral-500 text-sm py-4 text-center">No hay triggers en vision_trigger_overrides</p>
                                    )}
                                </div>
                            )}

                            {/* Crear nuevo Edge */}
                            <div className="border-t border-neutral-800 pt-4">
                                <h4 className="text-xs font-bold text-neutral-500 mb-3">+ Crear Nuevo Trigger Edge</h4>
                                <div className="flex items-center gap-3 p-3 bg-neutral-900 rounded-lg">
                                    <select
                                        value={newEdge.target}
                                        onChange={(e) => setNewEdge(prev => ({ ...prev, target: e.target.value }))}
                                        className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs"
                                    >
                                        <option value="photoscaler_prompt_rules">PhotoScaler</option>
                                        <option value="lightscaler_prompt_rules">LightScaler</option>
                                        <option value="stylescaler_prompt_rules">StyleScaler</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="JSON Match (ej: UNDEREXPOSED)"
                                        value={newEdge.relation}
                                        onChange={(e) => setNewEdge(prev => ({ ...prev, relation: e.target.value }))}
                                        className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs"
                                    />
                                    <button
                                        onClick={createEdge}
                                        className="flex items-center gap-1 px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded text-xs font-medium"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Crear
                                    </button>
                                </div>
                            </div>

                            {/* Edges del Sistema (read-only) */}
                            <div className="border-t border-neutral-800 pt-4">
                                <h4 className="text-xs font-bold text-neutral-500 mb-3">Edges del Sistema (Read-Only)</h4>
                                <div className="space-y-2 opacity-60">
                                    {systemEdges.map((edge, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {TABLE_ICONS[edge.source]}
                                                <span className="text-sm">{TABLE_DISPLAY_NAMES[edge.source]}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-neutral-600" />
                                            <div className="flex items-center gap-2">
                                                <Network className="w-4 h-4" />
                                                <span className="text-sm">{edge.target}</span>
                                            </div>
                                            <span className="ml-auto text-xs text-neutral-500">{edge.relation}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : (
                        /* Table Data View */
                        <div className="space-y-3">
                            {tableData.map(row => (
                                <div
                                    key={row.id}
                                    className={`bg-neutral-900 rounded-lg border ${pendingChanges[row.id] ? 'border-violet-500' : 'border-neutral-800'
                                        }`}
                                >
                                    {/* Row Header */}
                                    <div className="flex items-center justify-between p-3 hover:bg-neutral-800/50">
                                        <button
                                            onClick={() => {
                                                const newExpanded = new Set(expandedRows);
                                                if (newExpanded.has(row.id)) {
                                                    newExpanded.delete(row.id);
                                                } else {
                                                    newExpanded.add(row.id);
                                                }
                                                setExpandedRows(newExpanded);
                                            }}
                                            className="flex items-center gap-2 flex-1 text-left"
                                        >
                                            {expandedRows.has(row.id) ? (
                                                <ChevronDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4" />
                                            )}
                                            <span className="font-medium text-sm">
                                                {row.intensity_label || row.material_tag || row.config_key ||
                                                    row.style_slug || row.json_value_match || `ID: ${row.id?.substring(0, 8)}`}
                                            </span>
                                            {row.slider_value_min !== undefined && (
                                                <span className="text-xs text-neutral-500">
                                                    Nivel {row.slider_value_min}-{row.slider_value_max}
                                                </span>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {pendingChanges[row.id] && (
                                                <span className="text-xs text-violet-400">● Modificado</span>
                                            )}
                                            <button
                                                onClick={() => deleteRow(row.id)}
                                                className="p-1 hover:bg-red-900/50 rounded text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedRows.has(row.id) && currentSchema && (
                                        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-800">
                                            {currentSchema.columns
                                                .filter(col => col.column_name !== 'id' && col.column_name !== 'created_at')
                                                .map(column => (
                                                    <div key={column.column_name} className="space-y-1">
                                                        <label className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                                                            {column.column_name.replace(/_/g, ' ')}
                                                            <span className="text-[10px] text-neutral-600">({column.data_type})</span>
                                                        </label>
                                                        {renderCellEditor(row, column.column_name, column.data_type)}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {tableData.length === 0 && (
                                <div className="text-center py-12 text-neutral-500">
                                    <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>No hay registros en esta tabla</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminGodMode;
