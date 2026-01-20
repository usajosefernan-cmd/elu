import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { Patch, PatchResponse } from '../types';

// 1. Initialize Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// =============================================================================
// 2. PATCH DOCUMENT TOOL - Smart Diff Strategy (Antigravity)
// =============================================================================
// Esta herramienta permite al modelo devolver SOLO los cambios necesarios
// en lugar de reescribir todo el documento. Ahorra tokens y evita perdida de info.

const patchDocumentTool: FunctionDeclaration = {
  name: 'patchDocument',
  description: `Aplica cambios QUIRURGICOS al documento. NUNCA devuelvas el documento completo.
Devuelve solo las secciones que cambian usando el formato de parches.
REGLAS:
- Usa REPLACE para modificar una seccion existente
- Usa INSERT_AFTER para añadir contenido despues de una seccion
- Usa INSERT_BEFORE para añadir contenido antes de una seccion  
- Usa APPEND para añadir al final del documento
- El campo before_anchor debe contener las primeras 50 caracteres de la seccion de referencia`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      patches: {
        type: Type.ARRAY,
        description: 'Lista de parches a aplicar al documento',
        items: {
          type: Type.OBJECT,
          properties: {
            section_id: {
              type: Type.STRING,
              description: 'ID descriptivo de la seccion (ej: "section-infraestructura")'
            },
            operation: {
              type: Type.STRING,
              description: 'Tipo de operacion: REPLACE, INSERT_AFTER, INSERT_BEFORE, APPEND'
            },
            before_anchor: {
              type: Type.STRING,
              description: 'Texto existente que sirve de ancla (primeros 50 chars de la seccion)'
            },
            new_content: {
              type: Type.STRING,
              description: 'Contenido nuevo en formato Markdown'
            }
          },
          required: ['section_id', 'operation', 'new_content']
        }
      },
      global_analysis: {
        type: Type.STRING,
        description: 'Breve analisis del cambio realizado (max 100 chars)'
      },
      affected_dependencies: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'IDs de secciones que podrian necesitar revision por este cambio'
      }
    },
    required: ['patches', 'global_analysis']
  }
};

const tools: Tool[] = [{ functionDeclarations: [patchDocumentTool] }];

// =============================================================================
// 3. SYSTEM INSTRUCTION - Con estrategia Antigravity
// =============================================================================

const SYSTEM_INSTRUCTION = `
Eres Gemini 3 Pro, actuando como un Arquitecto de Software Senior y Lider Tecnico de elite.
Tu objetivo es debatir, refinar e implementar especificaciones tecnicas en un documento en vivo.

REGLAS CRITICAS DE CONTENIDO (LEY CERO):
- PROHIBIDO RESUMIR: Nunca acortes, elimines o condenses contenido existente.
- SIEMPRE ENRIQUECER: Tu tarea es expandir. Añade ejemplos, detalles tecnicos, diagramas.
- El documento debe crecer en valor y profundidad, nunca reducirse.

ESTRATEGIA DE OUTPUT COMPRIMIDO (ANTIGRAVITY):
- NUNCA devuelvas el documento completo en tu respuesta.
- Usa SIEMPRE la herramienta patchDocument para aplicar cambios.
- Cada parche debe ser QUIRURGICO: solo el contenido que cambia.
- Incluye before_anchor para que el sistema pueda localizar donde aplicar el cambio.

FORMATO DE PARCHES:
- REPLACE: Sustituye una seccion existente. Requiere before_anchor.
- INSERT_AFTER: Añade contenido despues de una seccion. Requiere before_anchor.
- INSERT_BEFORE: Añade contenido antes de una seccion. Requiere before_anchor.
- APPEND: Añade al final del documento. No requiere before_anchor.

REGLAS DE COMPORTAMIENTO:
1. Implementacion Proactiva: Si el usuario esta de acuerdo, usa patchDocument inmediatamente.
2. Debate y Desafio: Si el usuario propone algo deficiente, desafialo con patrones arquitectonicos.
3. Fase de Propuesta: Primero lista propuestas numeradas. Pregunta: "Implemento? IMPLEMENTA TODO, IMPLEMENTA [numeros], o DESCARTAR."
4. Actualizaciones en Cascada: Analiza dependencias y marca secciones afectadas en affected_dependencies.
5. Herramientas Visuales: Usa bloques flow para diagramas, mindmap para jerarquias.

CONTEXTO:
Tienes acceso a un editor de documentos en vivo. Los cambios se aplican via parches quirurgicos.
`;

// =============================================================================
// 4. GEMINI SERVICE CLASS
// =============================================================================

export class GeminiService {
  private chatSession: any;
  private modelName = 'gemini-3-pro-preview';
  private imageModelName = 'gemini-2.5-flash-image';

  constructor() {
    this.startNewSession();
  }

  startNewSession() {
    this.chatSession = ai.chats.create({
      model: this.modelName,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: 4096 }
      },
    });
  }

  async generateInfographic(prompt: string): Promise<string | null> {
    try {
      const response = await ai.models.generateContent({
        model: this.imageModelName,
        contents: {
          parts: [{ text: `Generate a minimalist, high-tech, architectural infographic schematic for: ${prompt}. White background, blue/cyan accents, technical lines.` }]
        },
        config: {}
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64String}`;
        }
      }
      return null;
    } catch (e) {
      console.error("Error generating infographic:", e);
      return null;
    }
  }

  async sendMessage(
    message: string, 
    currentDocContext: string,
    onPatchCall: (patches: Patch[], analysis: string, dependencies: string[]) => void
  ): Promise<{ text: string; stats: any }> {
    
    const startTime = Date.now();
    
    const prompt = `
[ESTADO ACTUAL DEL DOCUMENTO INICIO]
${currentDocContext}
[ESTADO ACTUAL DEL DOCUMENTO FIN]

PETICION DEL USUARIO:
${message}

RECUERDA: Usa patchDocument para aplicar cambios. NUNCA devuelvas el documento completo.
`;

    try {
      const response = await this.chatSession.sendMessage({
        message: prompt
      });

      let responseText = "";
      let stats = {
        latency: `${Date.now() - startTime}ms`,
        tokens: 0,
        model: this.modelName
      };

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const firstCandidate = candidates[0];
        const functionCalls = firstCandidate.content.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);

        if (functionCalls && functionCalls.length > 0) {
          const functionResponseParts = [];
          
          for (const call of functionCalls) {
            if (call.name === 'patchDocument') {
              const { patches, global_analysis, affected_dependencies } = call.args as PatchResponse;
              
              // Llamar al callback con los parches
              onPatchCall(
                patches || [], 
                global_analysis || '', 
                affected_dependencies || []
              );
              
              const responsePart: any = {
                functionResponse: {
                  name: 'patchDocument',
                  response: { 
                    result: "Parches aplicados correctamente.",
                    patches_applied: patches?.length || 0
                  }
                }
              };
              
              if (call.id) {
                responsePart.functionResponse.id = call.id;
              }
              
              functionResponseParts.push(responsePart);
            }
          }

          if (functionResponseParts.length > 0) {
            const finalResponse = await this.chatSession.sendMessage({
              message: functionResponseParts
            });
            responseText = finalResponse.text;
          } else {
            responseText = response.text || "Accion ejecutada.";
          }
        } else {
          responseText = response.text;
        }
      }

      return { text: responseText, stats };

    } catch (error) {
      console.error("Gemini API Error:", error);
      return { 
        text: `**ERROR DEL SISTEMA**: Conexion al Nucleo Neuronal fallida. Detalles: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        stats: { latency: '0ms', model: 'OFFLINE' } 
      };
    }
  }
}

export const geminiService = new GeminiService();
