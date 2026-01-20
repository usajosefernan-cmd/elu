import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import EditorPanel from './components/EditorPanel';
import { geminiService } from './services/geminiService';
import { Message, DocState } from './types';
import { getSupabaseClient } from '../../../services/authService';

// Initial Document Template
const INITIAL_DOC = `<!-- GEMINI 3 PRO: DOCUMENTO DE ARQUITECTURA DEL SISTEMA -->
<!-- ESTADO: BORRADOR | NIVEL DE SEGURIDAD: ALTO -->

# Especificación Técnica

## 1. Visión General
[El alcance del sistema está actualmente indefinido. Discutir con el Arquitecto para completar.]

## 2. Infraestructura Principal
- **Cómputo:** TBD (Por definir)
- **Base de Datos:** TBD
- **Caché:** TBD

## 3. Protocolos de Seguridad
- Autenticación: TBD
- Autorización (RLS): TBD

## 4. Análisis de Costes
[Pendiente]
`;

const INITIAL_MESSAGE: Message = {
  id: 1,
  role: 'ai',
  text: 'Gemini 3 Pro [KERNEL: v9.2.1-PREVIEW] inicializado. \n\nHe cargado el contexto global para Arquitectura de Sistemas Distribuidos. Estoy listo para operar como tu Arquitecto Principal. \n\nPodemos debatir sobre seguridad, optimizar costes o implementar esquemas de Supabase.\n\nCuando acordemos un cambio, actualizaré autónomamente el documento de la derecha. ¿Empezamos con la Capa de Datos?',
  timestamp: new Date().toLocaleTimeString(),
  stats: { tokens: 45, latency: '12ms', model: 'Gemini-3-Pro' }
};

import { ProjectLibrary } from './components/ProjectLibrary';
import { Grid, RefreshCw, Zap, Bot } from 'lucide-react';

interface AdminLuxCanvasProps {
  onBack?: () => void;
}

// Helper to reconstruct document from sections
const reconstructDocumentFromSections = async (docId: string, setDocState?: any, saveVersion?: any) => {
  console.log("🏗️ Iniciando reconstrucción atómica para:", docId);
  const supabase = getSupabaseClient();

  // 1. Fetch Ordered Sections
  const { data: sections, error } = await supabase
    .from('document_sections')
    .select('*')
    .eq('document_id', docId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error("❌ Fallo crítico en reconstrucción:", error);
    return;
  }

  if (!sections || sections.length === 0) {
    console.warn("⚠️ Documento sin secciones atómicas. Reteniendo contenido legacy.");
    return;
  }

  // 2. Build Markdown
  let fullMarkdown = "";
  sections.forEach((sec: any) => {
    const hash = "#".repeat(sec.level || 2);
    fullMarkdown += `${hash} ${sec.section_title}\n\n${sec.content}\n\n`;
  });

  fullMarkdown = fullMarkdown.trim();

  // 3. Update State & Version if provided
  if (setDocState) {
    setDocState((prev: DocState) => ({
      ...prev,
      content: fullMarkdown,
      lastUpdated: new Date().toISOString()
    }));
  }

  if (saveVersion) {
    await saveVersion("Reconstrucción Atómica (Auto)", fullMarkdown, "♻️ Sincronización desde DB Atómica");
  }

  return fullMarkdown;
};

export const AdminLuxCanvas: React.FC<AdminLuxCanvasProps> = ({ onBack }) => {
  // --- STATE ---
  const [activeView, setActiveView] = useState<'library' | 'editor'>('library');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Visual feedback when doc is touched
  const [showProcessWindow, setShowProcessWindow] = useState(false); // Process info window
  const [processLogs, setProcessLogs] = useState<string[]>([]); // Detailed AI process logs
  const [thinkingLog, setThinkingLog] = useState<string[]>([]);

  const [docState, setDocState] = useState<DocState>({
    title: 'Espec_Arquitectura_v1.md',
    content: INITIAL_DOC,
    lastUpdated: new Date().toISOString()
  });

  const [currentActivity, setCurrentActivity] = useState<string>('');

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<any>(null); // To store repo info

  // 🤖 AI MODE STATE
  const [aiMode, setAiMode] = useState<'chat' | 'agent'>('agent');
  const [autoApprove, setAutoApprove] = useState(false); // ⚡ AUTO-EXECUTE TOGGLE

  // 💡 NEW: Ref to track latest content without closure staleness issues in sync loops
  const docContentRef = React.useRef(INITIAL_DOC);

  useEffect(() => {
    docContentRef.current = docState.content;
  }, [docState.content]);

  // --- PERSISTENCE: Save/Load Chat ---
  useEffect(() => {
    // 1. Load from LocalStorage on Mount or Doc Change
    const key = currentDocId ? `lux_chat_${currentDocId}` : 'lux_chat_global';
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        // Sync AI Memory
        geminiService.restoreHistory(parsed);
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    } else {
      // Reset if new doc and no history
      if (currentDocId) {
        setMessages([INITIAL_MESSAGE]);
        geminiService.resetSession();
      }
    }
  }, [currentDocId]);

  const saveChatHistoryToSupabase = useCallback(async (msgs: Message[]) => {
    if (!currentDocId || msgs.length <= 1) return;
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('documents')
        .update({ chat_history: msgs })
        .eq('id', currentDocId);
    } catch (err) {
      console.error("Error saving chat to Supabase:", err);
    }
  }, [currentDocId]);

  useEffect(() => {
    if (messages.length > 1) {
      // 1. Local Backup
      const key = currentDocId ? `lux_chat_${currentDocId}` : 'lux_chat_global';
      localStorage.setItem(key, JSON.stringify(messages));

      // 2. Supabase Sync (Debounced ideally, but direct for now)
      saveChatHistoryToSupabase(messages);

      // 3. Keep Service History in Sync
      geminiService.restoreHistory(messages);
    }
  }, [messages, currentDocId, saveChatHistoryToSupabase]);

  const [appLink, setAppLink] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<any[]>([]);
  const [availableDocs, setAvailableDocs] = useState<string[]>([]);
  const [showDocSelector, setShowDocSelector] = useState(false);

  // --- ACTIONS ---
  const handleOpenDocumentFromLibrary = async (docId: string, title: string, project: any) => {
    setCurrentDocId(docId);
    setCurrentProject(project);
    await handleLoadDocument(docId, title); // Use ID for loading
    setActiveView('editor');
  };

  const toggleAiMode = () => {
    setAiMode(prev => prev === 'chat' ? 'agent' : 'chat');
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `🔄 Modo cambiado a: **${aiMode === 'chat' ? 'AGENTE (Herramientas Activas)' : 'CHAT (Solo Texto)'}**`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handlePushToGithub = async () => {
    if (!currentProject?.github_repo_url) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        text: `⚠️ **Error**: Este proyecto no está vinculado a GitHub.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      return;
    }

    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `🐙 Iniciando Push a GitHub (${currentProject.github_repo_url})...`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke('lux-git-sync', {
        body: {
          repoUrl: currentProject.github_repo_url,
          filePath: docState.title, // Use title as filename
          content: docState.content,
          message: `Update ${docState.title} via LuxCanvas`
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        text: `✅ **Push Exitoso**: [Ver en GitHub](${data.html_url}) commit: \`${data.commit.substring(0, 7)}\``,
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (err: any) {
      console.error("Git Sync Error", err);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        text: `❌ **Error en Push**: ${err.message || "Fallo en Edge Function"}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const handleSaveDocument = async () => {
    // Force Save
    await saveVersionToSupabase(docState.title, docState.content, '💾 Guardado Manual por Usuario');
    await fetchDocuments(); // Refresh list to show new title if changed

    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `✅ Documento guardado manualmente en Supabase.`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const fetchDocuments = async () => {
    const supabase = getSupabaseClient();
    // Hack allowing distinct titles on client side since distinct on column is tricky in simple query builder without raw SQL or Views
    // We fetch last 50 versions to get recent active docs
    const { data, error } = await supabase
      .from('document_versions')
      .select('document_title, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Extract unique titles
      const titles = Array.from(new Set(data.map(d => d.document_title)));
      setAvailableDocs(titles);
    }
  };

  const fetchHistory = async () => {
    if (!currentDocId) return; // Use ID instead of title
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('document_versions')
      .select('id, created_at, word_count, change_summary, version_number, content') // Select content too
      .eq('document_id', currentDocId) // Filter by ID
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setHistoryVersions(data);
    if (error) console.error("History error", error);
  };

  const handleRestoreVersion = (version: any) => {
    if (!confirm(`¿Restaurar la versión v${version.version_number}? Esto reemplazará el contenido actual.`)) return;

    setDocState(prev => ({
      ...prev,
      content: version.content || "", // Fallback to empty string
      lastUpdated: new Date().toISOString()
    }));

    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `↺ **Versión Restaurada**: v${version.version_number} (${new Date(version.created_at).toLocaleString()})`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setShowHistory(false);
  };

  const handleLoadDocument = async (docId: string, titleFallback?: string) => {
    const supabase = getSupabaseClient();

    // 0. Fetch Chat History (Always from Master)
    const { data: docMaster } = await supabase
      .from('documents')
      .select('chat_history')
      .eq('id', docId)
      .single();

    if (docMaster?.chat_history && Array.isArray(docMaster.chat_history) && docMaster.chat_history.length > 0) {
      setMessages(docMaster.chat_history);
    } else {
      setMessages([INITIAL_MESSAGE]);
    }

    // 1. Try to fetch from VERSION HISTORY (Latest)
    // We filter by document_id (UUID) not title, to ensure robustness
    const { data: versionData } = await supabase
      .from('document_versions')
      .select('content, change_summary, document_title')
      .eq('document_id', docId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let loadedContent = "";
    let loadedTitle = titleFallback || "";
    let loadedSummary = "";

    if (versionData) {
      loadedContent = versionData.content;
      loadedTitle = versionData.document_title || loadedTitle;
      loadedSummary = `Ultima versión: ${versionData.change_summary}`;
    } else {
      // 2. Fallback to MASTER table (documents)
      console.warn("⚠️ No history found. Fetching from master 'documents' table...");
      const { data: masterData } = await supabase
        .from('documents')
        .select('current_content, title')
        .eq('id', docId)
        .single();

      if (masterData) {
        loadedContent = masterData.current_content;
        loadedTitle = masterData.title;
        loadedSummary = "Versión Inicial (Borrador Maestro)";
      } else {
        console.error("❌ Document not found in versions OR master table.");
        return;
      }
    }

    // UPDATE STATE
    setDocState({
      title: loadedTitle,
      content: loadedContent,
      lastUpdated: new Date().toISOString()
    });

    // Add load message only if chat is empty or system
    // setMessages(prev => [...prev, { ... }]); 
    // Wait, if we loaded history, adding a new message "Document Loaded" might be redundant or useful.
    // I'll add it as a system note.
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `📂 Documento cargado: **${loadedTitle}**\n_${loadedSummary}_`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setShowDocSelector(false);
  };

  const handleNewDocument = () => {
    setDocState({
      title: 'Nuevo_Documento_v1.md',
      content: INITIAL_DOC,
      lastUpdated: new Date().toISOString()
    });
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `📄 Nuevo documento inicializado.`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // refresh docs on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // AUTO-SAVE CHAT HISTORY (Debounced)
  useEffect(() => {
    if (!currentDocId || messages.length <= 1) return; // Don't save empty/initial or no doc

    const timer = setTimeout(async () => {
      console.log('💾 Auto-saving chat history...');
      const supabase = getSupabaseClient();
      await supabase.from('documents').update({
        chat_history: messages
      }).eq('id', currentDocId);
    }, 2000);

    return () => clearTimeout(timer);
  }, [messages, currentDocId]);

  const handleShowHistory = () => {
    fetchHistory();
    setShowHistory(true);
  };



  // --- RESTORED LOGIC ---
  const [metrics, setMetrics] = useState({ cpu: 12, ram: 45, net: '1.2' });

  // Simulate system "life" metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 30) + 10,
        ram: Math.floor(Math.random() * 200) + 40,
        net: (Math.random() * 5).toFixed(1)
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- HELPERS ---
  const countWords = (str: string) => str.trim().split(/\s+/).length;

  const updateSectionInMarkdown = (fullText: string, title: string, newBody: string) => {
    const normalize = (s: string) => {
      if (!s) return "";
      return s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    const targetNormalized = normalize(title);

    const lines = fullText.split('\n');
    const headerIndices: number[] = [];

    // 1. Find ALL matching headers
    for (let i = 0; i < lines.length; i++) {
      const headerMatch = lines[i].match(/^(#{1,6})\s*(.*)/);
      if (headerMatch && headerMatch[2].trim()) {
        const headerText = headerMatch[2].trim();
        const headerNormalized = normalize(headerText);

        // Strict matching to avoid "Base" matching "Base de Datos"
        const isExact = headerNormalized === targetNormalized;
        const isPartial = headerNormalized.includes(targetNormalized) || targetNormalized.includes(headerNormalized);

        // We only match if it's exact OR a very strong partial (long enough)
        if (isExact || (isPartial && Math.abs(headerNormalized.length - targetNormalized.length) < 10)) {
          headerIndices.push(i);
        }
      }
    }

    // CASE A: NOT FOUND -> Try direct string search before appending
    if (headerIndices.length === 0) {
      if (!newBody.trim()) return fullText;

      // Last-resort check: is there a line that is EXACTLY the title (no #)?
      const fallbackIndex = lines.findIndex(l => normalize(l) === targetNormalized);
      if (fallbackIndex !== -1) {
        headerIndices.push(fallbackIndex);
      } else {
        return fullText.trim() + `\n\n## ${title}\n\n${newBody}`;
      }
    }

    // CASE B: FOUND (One or More) -> REPLACE FIRST, DELETE OTHERS
    // We process in reverse to not mess up indices if we were deleting during iteration, 
    // but here we just reconstruct the whole string once.

    // First match is our "Anchor"
    const anchorIndex = headerIndices[0];

    // Determine end of the first match's body
    let bodyEndIndexLine = lines.length;
    for (let j = anchorIndex + 1; j < lines.length; j++) {
      if (lines[j].match(/^(#{1,6})\s+/)) {
        bodyEndIndexLine = j;
        break;
      }
    }

    // Remove ALL OTHER matching headers and their content? 
    // Actually, for deduplication, let's keep it simple: 
    // Just replace the WHOLE document content with a logic that filters out the other matches.

    const isSpecialDeletion = !newBody || !newBody.trim() || newBody.includes("[ELIMINADO]");

    // 🛡️ SECURITY: Strip redundant title if AI included it in first line
    let cleanedBody = newBody.trim();
    const firstLine = cleanedBody.split('\n')[0];
    if (firstLine.match(/^#{1,6}\s+/) && normalize(firstLine.replace(/^#{1,6}\s+/, '')) === targetNormalized) {
      cleanedBody = cleanedBody.split('\n').slice(1).join('\n').trim();
    }

    const finalLines: string[] = [];
    let skipUntilNextHeader = false;

    for (let k = 0; k < lines.length; k++) {
      if (headerIndices.includes(k)) {
        if (k === anchorIndex) {
          if (!isSpecialDeletion) {
            // Keep existing header if it's a real header line, else create a new one
            const isLineHeader = lines[k].match(/^(#{1,6})\s*/);
            finalLines.push(isLineHeader ? lines[k] : `## ${title}`);
            finalLines.push("");
            finalLines.push(cleanedBody);
            finalLines.push("");
          }
          skipUntilNextHeader = true;
        } else {
          skipUntilNextHeader = true; // Delete duplicate
        }
        continue;
      }

      const isAnyHeader = lines[k].match(/^(#{1,6})\s*/);
      if (isAnyHeader) {
        skipUntilNextHeader = false;
      }

      if (!skipUntilNextHeader) {
        finalLines.push(lines[k]);
      }
    }

    return finalLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };



  const saveVersionToSupabase = async (title: string, content: string, log: string) => {
    try {
      const supabase = getSupabaseClient();
      await supabase.from('document_versions').insert({
        document_title: title,
        content: content,
        change_summary: log,
        document_id: currentDocId
      });
      console.log("💾 Versión guardada en Supabase");
    } catch (err) {
      console.error("Error guardando versión:", err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🛡️ HUMAN-IN-THE-LOOP: CHECKPOINTS & APPROVALS
  // ═══════════════════════════════════════════════════════════════
  type PendingAction = {
    id: number;
    type: string;
    data: any;
    description: string;
    diffStats: { words: number; chars: number; diffWords: number };
  };
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Intercept Tool Updates
  const executeToolAction = async (action: string, data: any) => {
    // ... (Original logic from handleToolUpdate moved here) ...
    // NOTE: Copying the existing switch case logic here to execute ONLY when approved

    // 🔔 Visual feedback: Flash the editor
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 2000);

    setDocState(prev => {
      let nextContent = prev.content;
      let changeLog = "";

      if (action === 'UPDATE' || action === 'UPDATE_FULL') {
        nextContent = data.content;
        changeLog = data.changeLog || "Reconstrucción total del documento";
        setCurrentActivity(`Reconstruyendo documento maestro...`);
      } else if (action === 'APPEND' || action === 'UPDATE_SECTION') {
        nextContent = updateSectionInMarkdown(prev.content, data.title || data.sectionTitle, data.content || data.newContent);
        changeLog = data.changeLog || `${action === 'APPEND' ? '➕' : '📝'} Sección: ${data.title || data.sectionTitle}`;
        setCurrentActivity(`Procesando sección: ${data.title || data.sectionTitle}`);
      } else if (action === 'UPSERT_SECTION') {
        const supabase = getSupabaseClient();
        if (currentDocId) {
          supabase.from('document_sections').upsert({
            document_id: currentDocId,
            section_title: data.title,
            content: data.content,
            order_index: data.orderIndex || 100, // Default to 100
            level: data.level || 2,
            is_locked: false
          }, { onConflict: 'document_id, section_title' }).then(async ({ error }) => {
            if (!error) {
              console.log("✅ Sección persistida. Reconstruyendo...");
              reconstructDocumentFromSections(currentDocId, setDocState, (t, c, l) => saveVersionToSupabase(t, c, l));
            }
          });
        }
        nextContent = updateSectionInMarkdown(prev.content, data.title, data.content);
        changeLog = data.changeLog || `🔢 Sección Atómica: ${data.title} (Orden: ${data.orderIndex})`;
        setCurrentActivity(`Persistiendo sección: ${data.title}...`);

      } else if (action === 'REORDER_SECTIONS') {
        if (currentDocId && data.sections && Array.isArray(data.sections)) {
          const supabase = getSupabaseClient();
          const updates = data.sections.map((item: any) =>
            supabase.from('document_sections').update({ order_index: item.newOrderIndex }).eq('document_id', currentDocId).eq('section_title', item.sectionTitle)
          );
          Promise.all(updates).then(() => {
            reconstructDocumentFromSections(currentDocId, setDocState, (t, c, l) => saveVersionToSupabase(t, c, l));
          });
        }
        changeLog = data.changeLog || `🔀 Reorganización estructural aplicada`;
        setCurrentActivity(`Reorganizando estructura...`);
        return prev;
      } else {
        return prev;
      }

      // Logging & Success
      const currentWordCount = countWords(prev.content);
      const nextWordCount = countWords(nextContent);
      const diff = nextWordCount - currentWordCount;

      saveVersionToSupabase(prev.title, nextContent, changeLog);

      setTimeout(() => {
        setMessages(msgs => [...msgs, {
          id: Date.now(),
          role: 'system',
          text: `> DOC ACTUALIZADO: ${changeLog} (${diff > 0 ? '+' : ''}${diff} palabras).\n💾 Backup en Supabase OK.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, 0);

      return { ...prev, content: nextContent, lastUpdated: new Date().toISOString() };
    });

    setPendingAction(null); // Clear pending
  };

  const handleToolUpdate = useCallback((action: string, data: any) => {
    // 🛡️ SAFETY BRAKE: PREDICT DIFF
    // For now, we intercept ALL structural changes (UPSERT, REORDER, OVERWRITE)
    // Simple updates usually don't need blocking unless massive

    let description = "Actualización desconocida";
    if (action === 'UPSERT_SECTION') description = `Insertar/Actualizar Sección: "${data.title}" (Orden: ${data.orderIndex})`;
    if (action === 'REORDER_SECTIONS') description = `Reorganizar estructura (${data.sections?.length} secciones)`;
    if (action === 'UPDATE_FULL') description = `Sobrescribe el documento COMPLETO`;

    // Calculate simulated diff for risk assessment
    // (Simplification: We allow UPDATE_SECTION direct pass if needed, but for now block all for safety per user request)

    // 🔍 LOGGING: Inform User Tool was Received
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'system',
      text: `🛠️ **Herramienta Detectada**: \`${action}\`\n_${description}_`,
      timestamp: new Date().toLocaleTimeString()
    }]);

    if (autoApprove) {
      // ⚡ AUTO-EXECUTE BYPASS
      executeToolAction(action, data);
    } else {
      // 🛡️ MANUAL CHECKPOINT
      setPendingAction({
        id: Date.now(),
        type: action,
        data: data,
        description,
        diffStats: { words: 0, chars: 0, diffWords: 0 }
      });
      // Auto-scroll to approval card (implied by rendering)
    }

  }, [currentDocId]);

  const approveAction = () => {
    if (pendingAction) executeToolAction(pendingAction.type, pendingAction.data);
  };

  const rejectAction = () => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role: 'system',
      text: `❌ Acción rechazada por el usuario.`,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setPendingAction(null);
  };

  const handleSendMessage = async (textOverride?: string, files?: any[]) => {
    const text = textOverride || inputValue;
    if ((!text.trim() && (!files || files.length === 0)) || isTyping) return;

    setIsTyping(true);
    setCurrentActivity('Gemini analizando solicitud...');
    setInputValue('');

    // Optimistic UI update
    const newUserMsg: Message = {
      id: Date.now() + Math.random(),
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString(),
      // attachments: files // Todo: Implement logic for file attachments if needed in Message type
    };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      setThinkingLog([]); // Reset thinking log

      const response = await geminiService.sendMessage(
        text,
        docContentRef.current,
        handleToolUpdate,
        aiMode // Pass current mode
      );

      const newAiMsg: Message = {
        id: Date.now() + Math.random() + 1,
        role: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString(),
        stats: {
          tokens: response.usage?.totalTokens || 0,
          latency: '0ms',
          model: 'Gemini-3-Pro'
        }
      };
      setMessages(prev => [...prev, newAiMsg]);

      // Save to history persistence
      saveChatHistoryToSupabase([...messages, newUserMsg, newAiMsg]);

    } catch (error: any) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        role: 'system',
        text: `❌ Error de sistema: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
      setCurrentActivity('');
    }
  };


  // ═══════════════════════════════════════════════════════════════
  // 🔄 PROTOCOLO DE REVISIÓN RECURSIVA - "SINCRONIZAR"
  // ═══════════════════════════════════════════════════════════════
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTurn, setSyncTurn] = useState(0);
  const MAX_SYNC_TURNS = 5; // Limit to prevent infinite loops

  const handleSyncReview = async () => {
    if (isSyncing || isTyping) return;

    setIsSyncing(true);
    setSyncTurn(0);
    setShowProcessWindow(true);
    setProcessLogs([]);
    setCurrentActivity('Iniciando protocolo de sincronización...');

    const addLog = (msg: string) => {
      const ts = new Date().toLocaleTimeString();
      setProcessLogs(prev => [...prev, `[${ts}] ${msg}`]);
    };

    addLog("🏗️ PROTOCOLO DE ARQUITECTO v5.0: REVISIÓN RECURSIVA ACTIVA");
    addLog("├─ Proceso: Sincronización Diferencial (Butterfly Effect)");
    addLog("├─ Límite: 64k Output / 1M Input");
    addLog("└─ Estado: Iniciando escaneo de inconsistencias...");

    // SYNC PROMPT - Forces the AI to analyze and fix the document
    const syncPrompt = `
🔄 MODO SINCRONIZACIÓN ACTIVADO - REVISIÓN OBLIGATORIA

INSTRUCCIONES CRÍTICAS:
1. ESCANEA el documento completo buscando:
   - Secciones duplicadas
   - Inconsistencias entre secciones
   - Contenido huérfano o desconectado
   - Errores de formato o estructura

2. PARA CADA PROBLEMA ENCONTRADO:
   - USA la herramienta updateSection para CORREGIRLO
   - NO describas lo que harías, HAZLO directamente

3. DESPUÉS DE CADA CORRECCIÓN:
   - Verifica si el cambio afectó otras secciones
   - Si sí, corrígelas también con updateSection

4. AL FINALIZAR:
   - Reporta un resumen de los cambios realizados
   - Confirma que el documento está unificado

⚠️ REGLA ABSOLUTA: Debes usar updateSection para CADA corrección. 
Si solo respondes con texto sin usar la herramienta, el documento NO cambiará.

COMIENZA EL ESCANEO AHORA.
`;

    let currentTurn = 0;
    let lastResponseText = "";

    while (currentTurn < MAX_SYNC_TURNS) {
      currentTurn++;
      setSyncTurn(currentTurn);
      addLog(`🔁 TURNO ${currentTurn}/${MAX_SYNC_TURNS}: Ejecutando análisis...`);
      setCurrentActivity(`Arquitecto analizando turno ${currentTurn}...`);

      try {
        const response = await geminiService.sendMessage(
          currentTurn === 1 ? syncPrompt : `Continúa la revisión. Turno ${currentTurn}. ¿Hay más inconsistencias? Si las hay, usa updateSection para corregirlas. Si no hay más, di "SINCRONIZACIÓN COMPLETA".`,
          docContentRef.current, // 🛠️ FIXED: Use ref for up-to-date content
          handleToolUpdate,
          'agent' // Force agent mode for Sync
        );

        addLog(`📨 Respuesta recibida (${response.text.length} chars)`);

        // Check if AI called any tools
        if (response.functionCalls && response.functionCalls.length > 0) {
          addLog(`🔧 Herramientas usadas: ${response.functionCalls.length}`);
          response.functionCalls.forEach((fc: any) => {
            addLog(`   └─ ${fc.name}: ${fc.args?.sectionTitle || 'N/A'}`);
          });
        }

        // Check for completion signal
        if (response.text.includes("SINCRONIZACIÓN COMPLETA") ||
          response.text.includes("UNIFICADO") ||
          response.text.includes("No hay más inconsistencias") ||
          response.text.includes("No se detectan más inconsistencias")) {
          addLog("✅ SINCRONIZACIÓN COMPLETADA - Documento unificado");
          setCurrentActivity("Sincronización completa ✅");
          break;
        }

        // If same response as last time, likely stuck
        if (response.text === lastResponseText) {
          addLog("⚠️ Respuesta repetida detectada. Finalizando.");
          break;
        }

        lastResponseText = response.text;

        // Add AI message to chat
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'ai',
          text: `[SYNC T${currentTurn}] ${response.text.substring(0, 300)}...`,
          timestamp: new Date().toLocaleTimeString()
        }]);

      } catch (error: any) {
        addLog(`❌ ERROR: ${error.message}`);
        break;
      }
    }

    addLog(`📊 Proceso completado en ${currentTurn} turnos`);
    setIsSyncing(false);
    if (!currentActivity.includes("completa")) { // Only clear if not already set to complete
      setCurrentActivity('');
    }
  };

  const handleEmergencyOverwrite = async () => {
    if (isSyncing || isTyping) return;

    const ok = window.confirm("⚠️ ADVERTENCIA: PURGA ESTRUCTURAL\n\nEsto forzará a la IA a reescribir el documento ENTERO. Es ideal para limpiar duplicados masivos que el modo quirúrgico no pudo resolver.\n\n¿Continuar?");
    if (!ok) return;

    setInputValue("PURGA TOTAL Y RECONSTRUCCIÓN: Por favor, analiza el documento actual, detecta todos los duplicados y secciones redundantes, y usa la herramienta overwriteFullDocument para reescribir una versión ÚNICA, LIMPIA y ORGANIZADA del documento. Elimina cualquier basura o repetición.");
    handleSendMessage();
  };

  /**
   * RENDER LOGIC
   * We swap between ProjectLibrary and Editor
   */
  if (activeView === 'library') {
    return <ProjectLibrary onOpenDocument={handleOpenDocumentFromLibrary} />;
  }

  return (
    <div className="flex flex-row h-full w-full bg-[#050505] text-slate-300 font-mono overflow-hidden selection:bg-cyan-900/50 relative min-h-0">

      {/* BACK TO PROJECTS BUTTON */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <button
          onClick={() => setActiveView('library')}
          className="bg-black/80 hover:bg-blue-900/80 text-white p-2 rounded-lg border border-slate-700 hover:border-blue-500 transition-all shadow-xl backdrop-blur-md"
          title="Volver a Proyectos"
        >
          <Grid size={20} />
        </button>

        {/* EMERGENCY BUTTON */}
        <button
          onClick={handleEmergencyOverwrite}
          className="bg-black/80 hover:bg-red-900/80 text-white p-2 rounded-lg border border-slate-700 hover:border-red-500 transition-all shadow-xl backdrop-blur-md group flex items-center gap-2"
          title="Purga y Reconstrucción Total"
        >
          <Zap className={`w-5 h-5 ${isTyping ? 'animate-pulse text-yellow-500' : 'text-red-400'}`} />
          <span className="hidden group-hover:inline text-xs font-bold uppercase tracking-wider">Reconstruir</span>
        </button>

        <button
          onClick={handleSyncReview}
          disabled={isSyncing || isTyping}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shadow-xl backdrop-blur-md ${isSyncing
            ? 'bg-orange-900/80 border-orange-500 text-orange-300 animate-pulse'
            : 'bg-black/80 hover:bg-emerald-900/80 border-slate-700 hover:border-emerald-500 text-white'
            }`}
          title="Revisar y Sincronizar documento"
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          <span className="text-xs font-bold">
            {isSyncing ? `SYNC T${syncTurn}...` : 'SYNC'}
          </span>
        </button>

      </div>

      {/* CENTER: AI MODE TOGGLE */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex bg-black/80 rounded-full p-1 border border-slate-700 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setAiMode('chat')}
          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${aiMode === 'chat' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          CHAT
        </button>
        <button
          onClick={() => setAiMode('agent')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${aiMode === 'agent' ? 'bg-cyan-900/80 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Bot size={12} />
          AGENT
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-2"></div>

        <label className="flex items-center gap-2 cursor-pointer group" title="Ejecutar cambios sin preguntar">
          <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${autoApprove ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 group-hover:border-slate-300'}`}>
            {autoApprove && <span className="text-[8px] text-black font-bold">✓</span>}
          </div>
          <span className={`text-[9px] font-bold ${autoApprove ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
            AUTO
          </span>
          <input type="checkbox" className="hidden" checked={autoApprove} onChange={() => setAutoApprove(!autoApprove)} />
        </label>
      </div>

      {/* Left: Chat & Controls */}
      <ChatPanel
        messages={messages}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        thinkingLog={thinkingLog}
        metrics={metrics}
      />

      {/* Right: Document Editor */}
      <EditorPanel
        docState={docState}
        setDocContent={(content) => setDocState(prev => ({ ...prev, content }))}
        setDocTitle={(title) => setDocState(prev => ({ ...prev, title }))}
        isTyping={isTyping}
        isUpdating={isUpdating}
        onSave={handleSaveDocument}
        appLink={appLink}
        setAppLink={setAppLink}
        onShowHistory={handleShowHistory}
        availableDocs={availableDocs}
        onLoadDocument={handleLoadDocument}
        onNewDocument={handleNewDocument}
        showDocSelector={showDocSelector}
        setShowDocSelector={setShowDocSelector}
        currentActivity={currentActivity} // Pass currentActivity here
        onContextComment={(sectionTitle) => {
          setInputValue(`// Analiza la sección "${sectionTitle}": \nQuiero que revises esta sección para...`);
          // Optional: Auto-focus chat input logic here if needed, but react state update usually enough
        }}

        // NEW PROPS
        onPushToGithub={handlePushToGithub}
        hasGithubRepo={!!currentProject?.github_repo_url}
      />

      {/* AI PROCESS INFO WINDOW (Floating) */}
      {
        showProcessWindow && processLogs.length > 0 && (
          <div className="absolute bottom-4 right-4 z-50 w-96 max-h-80 bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 backdrop-blur-sm overflow-hidden animate-pulse-once">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-cyan-900/30 to-transparent">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <span className="animate-spin">⚙️</span> Proceso de Edición AI
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProcessLogs([])}
                  className="text-[10px] text-slate-500 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                >Limpiar</button>
                <button
                  onClick={() => setShowProcessWindow(false)}
                  className="text-slate-400 hover:text-white text-lg"
                >×</button>
              </div>
            </div>
            <div className="p-3 overflow-y-auto max-h-56 font-mono text-[10px] space-y-1">
              {processLogs.slice(-20).map((log, idx) => (
                <div
                  key={idx}
                  className={`py-0.5 px-1 rounded ${log.includes('✅') ? 'text-green-400 bg-green-900/20' :
                    log.includes('📊') ? 'text-blue-400 bg-blue-900/20' :
                      log.includes('🎯') ? 'text-orange-400 bg-orange-900/20' :
                        log.includes('💾') ? 'text-purple-400 bg-purple-900/20' :
                          'text-slate-400'
                    }`}
                >
                  {log}
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-slate-800 text-center">
              <span className="text-[9px] text-slate-500">{processLogs.length} eventos registrados</span>
            </div>
          </div>
        )
      }

      {/* 🛡️ APPROVAL CARD (CHECKPOINT) */}
      {
        pendingAction && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-amber-500/50 rounded-xl w-full max-w-lg shadow-2xl shadow-amber-900/20 overflow-hidden transform transition-all scale-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-900/40 to-slate-900 p-4 border-b border-amber-500/30 flex items-center gap-3">
                <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
                  <div className="animate-pulse">✋</div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-100">Checkpoint de Seguridad</h3>
                  <p className="text-xs text-amber-400/80 uppercase tracking-wider">La IA requiere aprobación humana</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase mb-1">Acción Propuesta</div>
                  <div className="text-white font-mono text-sm">{pendingAction.description}</div>
                </div>

                {pendingAction.type === 'UPDATE_FULL' && (
                  <div className="bg-red-900/20 p-3 rounded border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    ⚠️ <strong>ALERTA DESTRUCTIVA:</strong> Esta acción sobrescribirá todo el documento.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex gap-3 justify-end">
                <button
                  onClick={rejectAction}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={approveAction}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-lg hover:shadow-amber-500/20 transition-all text-sm font-bold flex items-center gap-2"
                >
                  <span>Aprobar Ejecución</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* HISTORY MODAL (Simple Overlay) */}
      {
        showHistory && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-12">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">⏳ Historial de Versiones</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {historyVersions.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">No hay versiones guardadas aún.</div>
                ) : (
                  historyVersions.map((v) => (
                    <div key={v.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors flex justify-between items-center group">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-xs font-bold">v{v.version_number}</span>
                          <span className="text-slate-400 text-xs">{new Date(v.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-200">{v.change_summary || "Sin resumen"}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-1">{v.word_count} palabras</div>
                        <button
                          onClick={() => handleRestoreVersion(v)}
                          className="text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider"
                        >
                          Restaurar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};