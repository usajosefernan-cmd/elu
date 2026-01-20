import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from './components/ChatPanel';
import EditorPanel from './components/EditorPanel';
import { geminiService } from './services/geminiService';
import { patchService } from './services/patchService';
import { Message, DocState, Patch, PatchResponse } from './types';

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
  text: 'Gemini 3 Pro [KERNEL: v9.2.1-PREVIEW] inicializado. \n\nHe cargado el contexto global para Arquitectura de Sistemas Distribuidos. Estoy listo para asistir con:\n- Diseño de microservicios\n- Optimización de bases de datos\n- Protocolos de seguridad\n- Estimación de costes cloud\n\n¿En qué área deseas comenzar?',
  timestamp: new Date().toLocaleTimeString()
};

// ============================================================
// ANTIGRAVITY ENGINE: Smart Diff Strategy
// ============================================================
// Este sistema aplica cambios QUIRÚRGICOS al documento.
// NUNCA reescribe el documento completo - solo modifica las partes necesarias.
// Ahorra tokens, evita pérdida de información, y mantiene la coherencia.

function App() {
  const [document, setDocument] = useState<DocState>({
    content: INITIAL_DOC,
    lastModified: new Date(),
    version: 1
  });
  
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [patchHistory, setPatchHistory] = useState<PatchResponse[]>([]);

  // ============================================================
  // HANDLER: Procesar Patches del Modelo
  // ============================================================
  const handlePatchDocument = useCallback((patches: Patch[]): PatchResponse => {
    console.log('[ANTIGRAVITY] Recibidos patches:', patches.length);
    
    // Aplicar patches usando el motor de Smart Diff
    const result = patchService.applyPatches(document.content, patches);
    
    if (result.success && result.newContent) {
      // Actualizar documento con cambios quirúrgicos
      setDocument(prev => ({
        content: result.newContent!,
        lastModified: new Date(),
        version: prev.version + 1
      }));
      
      // Registrar en historial para debugging/undo
      setPatchHistory(prev => [...prev, result]);
      
      console.log('[ANTIGRAVITY] Patches aplicados:', result.appliedPatches);
      console.log('[ANTIGRAVITY] Compresión:', 
        `${patches.length} patches vs reescritura completa`);
    } else {
      console.error('[ANTIGRAVITY] Error aplicando patches:', result.errors);
    }
    
    return result;
  }, [document.content]);

  // ============================================================
  // HANDLER: Procesar Mensajes del Chat
  // ============================================================
  const handleSendMessage = useCallback(async (text: string) => {
    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      // Llamar a Gemini con el documento actual como contexto
      const response = await geminiService.chat(text, document.content);
      
      // Verificar si hay patches para aplicar
      if (response.patches && response.patches.length > 0) {
        console.log('[ANTIGRAVITY] Modelo devolvió patches, aplicando...');
        const patchResult = handlePatchDocument(response.patches);
        
        // Añadir mensaje AI con resumen de cambios
        const aiMessage: Message = {
          id: messages.length + 2,
          role: 'ai',
          text: response.text + (patchResult.success 
            ? `\n\n✅ **Cambios aplicados:** ${patchResult.appliedPatches} patches ejecutados.`
            : `\n\n⚠️ **Advertencia:** Algunos patches fallaron. Errores: ${patchResult.errors?.join(', ')}`),
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Respuesta sin patches (solo conversación)
        const aiMessage: Message = {
          id: messages.length + 2,
          role: 'ai',
          text: response.text,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('[CHAT] Error:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'ai',
        text: '❌ Error de comunicación con el modelo. Por favor, intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [messages, document.content, handlePatchDocument]);

  // ============================================================
  // HANDLER: Edición Manual del Documento
  // ============================================================
  const handleDocumentChange = useCallback((newContent: string) => {
    setDocument(prev => ({
      content: newContent,
      lastModified: new Date(),
      version: prev.version + 1
    }));
  }, []);

  // ============================================================
  // HANDLER: Deshacer Último Patch
  // ============================================================
  const handleUndoLastPatch = useCallback(() => {
    if (patchHistory.length === 0) return;
    
    // Obtener el contenido anterior del último patch
    const lastPatch = patchHistory[patchHistory.length - 1];
    if (lastPatch.previousContent) {
      setDocument(prev => ({
        content: lastPatch.previousContent!,
        lastModified: new Date(),
        version: prev.version + 1
      }));
      setPatchHistory(prev => prev.slice(0, -1));
      console.log('[ANTIGRAVITY] Undo ejecutado');
    }
  }, [patchHistory]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Luxcanvas</h1>
        <div className="header-controls">
          <span className="version-badge">v{document.version}</span>
          <span className="patch-count">Patches: {patchHistory.length}</span>
          <button 
            onClick={handleUndoLastPatch}
            disabled={patchHistory.length === 0}
            className="undo-btn"
          >
            ↶ Deshacer
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <ChatPanel 
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
        <EditorPanel 
          content={document.content}
          onChange={handleDocumentChange}
          lastModified={document.lastModified}
        />
      </main>
      
      <footer className="app-footer">
        <span>Antigravity Engine v1.0 | Smart Diff Strategy</span>
        <span>Última modificación: {document.lastModified.toLocaleTimeString()}</span>
      </footer>
    </div>
  );
}

export default App;
