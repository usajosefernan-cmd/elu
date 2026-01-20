import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '../../../../services/authService';
import { Folder, FileText, Plus, Github, Search, ArrowRight, Grid, List as ListIcon, Clock, ChevronRight } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    description: string;
    github_repo_url: string;
    updated_at: string;
}

interface Document {
    id: string;
    title: string;
    status: string;
    updated_at: string;
}

interface ProjectLibraryProps {
    onOpenDocument: (docId: string, title: string) => void;
    onBack?: () => void;
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ onOpenDocument, onBack }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [loading, setLoading] = useState(true);

    // New Project Form State
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newRepoUrl, setNewRepoUrl] = useState('');

    const supabase = getSupabaseClient();

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchDocuments(selectedProject.id);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (data) setProjects(data);
        if (error) console.error("Error fetching projects:", error);
        setLoading(false);
    };

    const fetchDocuments = async (projectId: string) => {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('project_id', projectId)
            .order('updated_at', { ascending: false });

        if (data) setDocuments(data);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        // [FIX] Get current user to satisfy RLS (auth.uid() = owner_id)
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Error: Sesión no válida. Por favor recarga.");
            return;
        }

        const { data, error } = await supabase.from('projects').insert({
            name: newProjectName,
            description: newProjectDesc,
            github_repo_url: newRepoUrl,
            owner_id: user.id
        }).select().single();

        if (error) {
            console.error("Error creating project:", error);
            alert(`Error al crear proyecto: ${error.message}`);
            return;
        }

        if (data) {
            setProjects([data, ...projects]);
            setShowNewProjectModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
            setNewRepoUrl('');
        }
    };

    const handleCreateDocument = async () => {
        if (!selectedProject) return;
        const title = `Nuevo Doc ${documents.length + 1}`;

        const { data, error } = await supabase.from('documents').insert({
            project_id: selectedProject.id,
            title: title,
            status: 'borrador',
            current_content: '# Nuevo Documento\n\nEmpieza a escribir...'
        }).select().single();

        if (data) {
            setDocuments([data, ...documents]);
            // Optional: Auto open
        }
    };

    return (
        <div className="h-full bg-slate-50 flex overflow-hidden font-sans text-slate-800">
            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* HEADER */}
                <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="p-2 rounded-lg bg-slate-100/50 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all border border-slate-200/50"
                                    title="Volver al Dashboard"
                                >
                                    <ArrowRight className="rotate-180" size={20} />
                                </button>
                            )}
                            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
                                <Grid size={20} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800">Biblioteca de Proyectos</h1>
                            <p className="text-xs text-slate-500">Gestión de Documentación Técnica</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                                placeholder="Buscar proyectos..."
                                className="pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                        </div>
                        <button
                            onClick={() => setShowNewProjectModal(true)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                        >
                            <Plus size={16} /> Nuevo Proyecto
                        </button>
                    </div>
                </div>

                {/* BREADCRUMBS & TOOLS */}
                {selectedProject && (
                    <div className="h-12 bg-white border-b border-slate-100 px-8 flex items-center gap-2 text-sm text-slate-500">
                        <span onClick={() => setSelectedProject(null)} className="cursor-pointer hover:text-blue-600 hover:underline">Proyectos</span>
                        <ChevronRight size={14} />
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                            <Folder size={14} className="text-blue-500" /> {selectedProject.name}
                        </span>
                        {selectedProject.github_repo_url && (
                            <a href={selectedProject.github_repo_url} target="_blank" rel="noreferrer" className="ml-4 flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-700">
                                <Github size={12} /> {selectedProject.github_repo_url.split('/').pop()}
                            </a>
                        )}
                    </div>
                )}

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-8">

                    {!selectedProject ? (
                        // PROJECTS GRID
                        loading ? (
                            <div className="flex items-center justify-center h-64 text-slate-400">Cargando Universos...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map(project => (
                                    <div
                                        key={project.id}
                                        onClick={() => setSelectedProject(project)}
                                        className="group bg-white border border-slate-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight size={20} className="text-blue-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                                        </div>
                                        <div className="mb-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                                                <Folder size={24} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">{project.name}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">{project.description || "Sin descripción"}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(project.updated_at).toLocaleDateString()}</span>
                                            {project.github_repo_url && <Github size={14} className="text-slate-600" />}
                                        </div>
                                    </div>
                                ))}

                                {/* New Project Card Placeholder */}
                                <button
                                    onClick={() => setShowNewProjectModal(true)}
                                    className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[200px]"
                                >
                                    <Plus size={32} className="mb-2" />
                                    <span className="font-bold text-sm">Crear Nuevo Proyecto</span>
                                </button>
                            </div>
                        )
                    ) : (
                        // DOCUMENTS LIST
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800">Documentos</h2>
                                <button
                                    onClick={handleCreateDocument}
                                    className="flex items-center gap-2 text-sm text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus size={16} /> Crear Documento
                                </button>
                            </div>

                            {documents.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <div className="text-slate-300 mb-4"><FileText size={48} className="mx-auto" /></div>
                                    <p className="text-slate-500 mb-4">Este proyecto está vacío.</p>
                                    <button onClick={handleCreateDocument} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Crear Primer Documento</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {documents.map(doc => (
                                        <div
                                            key={doc.id}
                                            onClick={() => onOpenDocument(doc.id, doc.title)}
                                            className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer flex items-center justify-between group shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-100 p-2.5 rounded text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{doc.title}</h4>
                                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${doc.status === 'final' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                                        {doc.status.toUpperCase()} • Actualizado hace {Math.floor((Date.now() - new Date(doc.updated_at).getTime()) / (1000 * 60 * 60))}h
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* NEW PROJECT MODAL */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">Nuevo Proyecto</h2>
                            <p className="text-sm text-slate-500">Crea un espacio para tu documentación técnica.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre del Proyecto</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: Core Backend API"
                                    value={newProjectName}
                                    onChange={e => setNewProjectName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                    placeholder="Breve descripción del propósito..."
                                    value={newProjectDesc}
                                    onChange={e => setNewProjectDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-2"><Github size={12} /> Repo URL (Opcional)</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    placeholder="https://github.com/org/repo"
                                    value={newRepoUrl}
                                    onChange={e => setNewRepoUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">Cancelar</button>
                            <button onClick={handleCreateProject} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20">Crear Proyecto</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
