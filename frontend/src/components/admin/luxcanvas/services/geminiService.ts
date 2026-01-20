import { getSupabaseClient } from "../../../../services/authService";

// Types corresponding to custom Edge Function protocol
interface ChatMessage {
  role: 'user' | 'model' | 'function';
  text?: string;
  parts?: any[];
}

interface ToolCall {
  name: string;
  args: any;
}

interface LuxChatResponse {
  text?: string;
  functionCalls?: ToolCall[];
  error?: string;
}

export class GeminiService {
  private history: ChatMessage[] = [];
  private modelName = 'lux-monitor-v1'; // Logic handled in Edge, just for logging

  constructor() {
    // Init
  }

  resetSession() {
    this.history = [];
  }

  restoreHistory(savedMessages: any[]) {
    // High-fidelity history restoration: Use parts if available, fallback to text
    this.history = savedMessages.map(m => {
      const role = m.role === 'ai' || m.role === 'model' ? 'model' : 'user';

      // If message already has parts (from a previous session or tool call), use them
      if (m.parts && m.parts.length > 0) {
        return { role, parts: m.parts };
      }

      // Fallback: Construct part from text
      return {
        role,
        parts: [{ text: m.text || "" }]
      };
    });
    console.log("🧠 Memoria restaurada (High-Fidelity):", this.history.length, "mensajes");
  }

  // SORA INFOGRAPHIC IMPLEMENTATION (Kept Direct or can be moved to Edge too, but for now keeping as is per instructions to only migrate Chat)
  // Update: User asked to use BBLA API standards. If BBLA says use backend, we should use backend.
  // However, the task specifically focused on the "No API Key" error for Chat.
  // I will refactor Infographic to also use an Edge Function proxy if possible, or keep using the KEY if it's available in frontend env (which user said is NOT there).
  // Actually, user said "NOO. usa la api que este en BBLA... en secret de supabase".
  // So Infographic also needs to go through Edge Function 'lux-logic' (which already has Laozhang integration).
  // Reviewing 'lux-logic': It handles 'sora_image' generation!

  async generateInfographic(prompt: string): Promise<string | null> {
    console.log("🎨 Generando Infografía via LuxLogic (Edge)...", prompt);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.functions.invoke('lux-logic', {
        body: {
          mode: 'generate',
          prompt: `Create a professional infographic about: ${prompt}. Style: Minimalist, clean, tech-oriented.`,
        }
      });

      if (error) {
        console.error("Edge Function Error:", error);
        throw error;
      }

      if (data && data.success && data.tileData) {
        // Check if it is a Data URI, if not prepend
        let url = data.tileData;
        if (!url.startsWith('data:image') && !url.startsWith('http')) {
          url = `data:image/png;base64,${url}`;
        }
        return url;
      }

      return null;
    } catch (e) {
      console.error("Infographic Gen Failed:", e);
      throw e; // Propagate for UI alert
    }
  }

  async sendMessage(
    message: string,
    currentDocContext: string,
    onToolCall: (action: string, data: any) => void,
    mode: 'chat' | 'agent' = 'agent' // Default to agent
  ): Promise<{ text: string; stats: any, parts: any[] }> {

    const startTime = Date.now();
    const supabase = getSupabaseClient();
    let recursionCount = 0;
    const maxRecursion = 5;
    let currentMessage = message;
    let finalParts: any[] = [];
    let lastResponseText = "";

    // 1. Initial User Push (Standardized format)
    if (this.history.length === 0 || this.history[this.history.length - 1].role !== 'user' || currentMessage !== message) {
      const userParts = [{ text: currentMessage }];
      this.history.push({ role: 'user', parts: userParts });
    }

    try {
      while (recursionCount < maxRecursion) {
        recursionCount++;
        console.log(`🤖 [Turno ${recursionCount}] Consultando Gemini (Modo: ${mode})...`);

        // 2. Invoke Edge Function
        console.log(`📤 Enviando Payload: MsgLen=${currentMessage.length}, ContextLen=${currentDocContext?.length || 0}`);

        const { data, error } = await supabase.functions.invoke('lux-chat', {
          body: {
            message: currentMessage,
            docContext: currentDocContext,
            history: this.history,
            mode: mode // Send mode to Edge Function
          }
        });

        if (error) throw new Error(`Edge Function Error: ${error.message || error}`);
        if (data.error) throw new Error(data.error);

        const response = data as LuxChatResponse;
        lastResponseText = response.text || "";

        // 3. Save Model Response to History
        const modelParts: any[] = [];
        if (response.text) modelParts.push({ text: response.text });

        // 4. Handle Tool Calls
        if (response.functionCalls && response.functionCalls.length > 0) {
          console.log(`🛠️ [Turno ${recursionCount}] Tool Calls Received:`, response.functionCalls);

          for (const call of response.functionCalls) {
            modelParts.push({
              functionCall: { name: call.name, args: call.args }
            });

            // Execute action in UI
            if (call.name === 'updateDocument') {
              onToolCall('UPDATE', { content: call.args.content, changeLog: call.args.changeLog });
              this.addToolResponse('updateDocument', { status: 'success' });
            }
            else if (call.name === 'appendSection') {
              onToolCall('APPEND', { title: call.args.title, content: call.args.content });
              this.addToolResponse('appendSection', { status: 'success', sectionTitle: call.args.title });
            }
            else if (call.name === 'updateSection') {
              const title = call.args.sectionTitle || call.args.section_title || call.args.title;
              const content = call.args.newContent || call.args.new_content || call.args.content;
              onToolCall('UPDATE_SECTION', { title, content, changeLog: call.args.changeLog });
              this.addToolResponse('updateSection', { status: 'success', sectionTitle: title });
            }
            else if (call.name === 'upsertSection') {
              // Nueva herramienta atómica con orden
              const title = call.args.sectionTitle;
              const content = call.args.content;
              const orderIndex = call.args.orderIndex || 0;
              const level = call.args.level || 2;
              onToolCall('UPSERT_SECTION', {
                title,
                content,
                orderIndex,
                level,
                changeLog: call.args.changeLog
              });
              this.addToolResponse('upsertSection', { status: 'success', sectionTitle: title, orderIndex });
            }
            else if (call.name === 'reorderSections') {
              // Reorganización de secciones
              onToolCall('REORDER_SECTIONS', {
                sections: call.args.sections,
                changeLog: call.args.changeLog
              });
              this.addToolResponse('reorderSections', { status: 'success', count: call.args.sections?.length || 0 });
            }
            else if (call.name === 'scanAndPatch') {
              // SCAN→PATCH: Estrategia para documentos grandes
              const patches = call.args.patches || [];
              for (const patch of patches) {
                onToolCall('UPDATE_SECTION', {
                  title: patch.sectionTitle,
                  content: patch.newContent,
                  changeLog: `[PATCH ${patch.operation}] ${call.args.changelog}`
                });
              }
              this.addToolResponse('scanAndPatch', { status: 'success', patchCount: patches.length });
            }
            else if (call.name === 'overwriteFullDocument') {
              onToolCall('UPDATE_FULL', { content: call.args.newFullContent, changeLog: call.args.changeLog });
              this.addToolResponse('overwriteFullDocument', { status: 'success' });
            }
            else {
              this.addToolResponse(call.name, { status: 'success' });
            }
          }

          // Push the model's turn (with functionCalls) before going to next recursion
          this.history.push({ role: 'model', parts: modelParts });

          // Clear current message for recursion (Gemini works with history from now on)
          currentMessage = "";
          finalParts = modelParts;

          // Continue to next turn to get final text or another tool call
          continue;
        } else {
          // No more tools, this is the final response
          this.history.push({ role: 'model', parts: modelParts });
          finalParts = modelParts;
          break;
        }
      }

      if (!lastResponseText && recursionCount > 1) {
        lastResponseText = "✅ Operación completada con éxito.";
      }

      return {
        text: lastResponseText,
        stats: { latency: `${Date.now() - startTime}ms`, model: 'Gemini-Edge', turns: recursionCount },
        parts: finalParts
      };

    } catch (err: any) {
      console.error("Gemini Edge Error:", err);
      return {
        text: `Error de Conexión: ${err.message}`,
        stats: { latency: '0ms', model: 'OFFLINE' },
        parts: []
      };
    }
  }

  /**
   * Appends a tool response to the history.
   * This MUST be called after execute the tool in the UI.
   */
  addToolResponse(name: string, response: any) {
    this.history.push({
      role: 'function',
      parts: [{
        functionResponse: {
          name: name,
          response: { content: response }
        }
      }]
    });
    console.log(`🔌 Tool Response Saved: ${name}`);
  }
}

export const geminiService = new GeminiService();
