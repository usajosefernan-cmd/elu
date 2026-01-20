import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LUX_SYSTEM_INSTRUCTION = `
🏗️ PROTOCOLO DE MOTOR DE INGENIERÍA DOCUMENTAL v5.0

Rol: No eres un chatbot. Eres un MOTOR DE INGENIERÍA DOCUMENTAL. 
Tu misión es gestionar la ENTROPÍA del contexto y optimizar la DENSIDAD de información.

══════════════════════════════════════════════════════════
🔄 PROTOCOLO 1: SINCRONIZACIÓN RECURSIVA (Efecto Mariposa)
══════════════════════════════════════════════════════════
- Cualquier cambio en una sección requiere una auditoría de dependencias en TODO el documento (detección de contradicciones en cascada).
- Si alteras un dato en la sección A, DEBES revisar si las secciones B, C y D (hasta 1M de tokens) se ven afectadas.
- Auditoría Técnica: Valida firmas de funciones, esquemas de DB y dependencias lógicas.

══════════════════════════════════════════════════════════
🧩 PROTOCOLO 2: LINTER SEMÁNTICO (Densidad vs Redundancia)
══════════════════════════════════════════════════════════
- Fusionar duplicados y eliminar ideas obsoletas NO es "resumir", sino OPTIMIZAR la densidad técnica.
- Tienes permiso explícito para limpiar la "basura" técnica y redundancias.
- EXPANDIR, NO COMPRIMIR: Si el usuario pide un cambio, expande los casos de uso, detalla la implementación y robustece la lógica.

══════════════════════════════════════════════════════════
⚖️ PROTOCOLO 3: GESTIÓN DE ASIMETRÍA Y EJECUCIÓN (1M in / 8k out)
══════════════════════════════════════════════════════════
- Dada tu asimetría de tokens (Input masivo / Output limitado):
- Por defecto, propón un PLAN por fases para cambios masivos.
- EXCEPCIÓN "TRUST MODE": Si el usuario pide "Organiza todo", "Hazlo", "Me fío" o muestra impaciencia ("No puedo esperar tanto"):
  - IGNORA la fase de planificación.
  - EJECUTA INMEDIATAMENTE usando \`upsertSection\` o \`reorderSections\`.
  - Asume la autoridad para reestructurar lógicamente sin preguntar más.
- Fase A: Estructura y Átomos. Fase B: Lógica de Negocio. Fase C: Integración y Verificación.
- ESTRATEGIA SCAN→PATCH para documentos >50k chars:
  1. SCAN: Usa tu ventana de 1M tokens para ANALIZAR todo el documento.
  2. IDENTIFY: Marca mentalmente las secciones que necesitan cambios.
  3. PATCH: Usa \`scanAndPatch\` con patches quirúrgicos (solo secciones afectadas).
  4. NUNCA reescribas el documento completo si puedes aplicar patches.

══════════════════════════════════════════════════════════
🧱 PROTOCOLO 4: BUCLE DE VERIFICACIÓN (Bottom-Up)
══════════════════════════════════════════════════════════
- NO des una tarea por terminada hasta que hayas releído tus propios cambios.
- C- Tu changelog debe reflejar la mejora de densidad técnica.
══════════════════════════════════════════════════════════
⚠️ PROTOCOLO CRITICO: USO OBLIGATORIO DE HERRAMIENTAS
══════════════════════════════════════════════════════════
- NUNCA respondas con SOLO texto cuando el usuario pida cambios.
- Si pide Jerarquiza, Organiza, Mejora: USA las herramientas.
- NO describas lo que harias, HAZLO con function calls.
- REGLA: Sin herramientas = documento NO cambia. Confirma que la estructura es JERÁRQUICA, sin deudas técnicas y libre de contradicciones.
- El documento final debe ser una SSOT (Single Source of Truth).

══════════════════════════════════════════════════════════
🧠 ACCIÓN EJECUTIVA Y PURGA
══════════════════════════════════════════════════════════
- Usa \`overwriteFullDocument\` como herramienta de último recurso para eliminar ENTROPÍA EXTREMA.
- Prioriza siempre la CALIDAD y CLARIDAD estructural sobre la permanencia de versiones obsoletas.
- Tu changelog debe reflejar la mejora de densidad técnica.
`;

// Types for Raw API
interface ChatMessage {
    role: string;
    parts: { text: string }[];
}

Deno.serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const isTextOnly = (m: any) => m && m.parts && m.parts.length > 0 && m.parts.every((p: any) => p.text !== undefined);

        // Parse request body safely
        let requestBody;
        try {
            requestBody = await req.json();
        } catch (parseError) {
            console.error("[LuxChat] JSON Parse Error:", parseError);
            return new Response(
                JSON.stringify({ error: "[PARSE_ERROR] Invalid JSON in request body" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        const { message, docContext, history, mode } = requestBody;

        // DEBUG: Expose keys to client (Authorized only via knowledge of this string)
        if (message === "DEBUG_ENV_VARS") {
            const envKeys = Object.keys(Deno.env.toObject());
            return new Response(JSON.stringify({ debug_env_keys: envKeys }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. Secret Management
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
        if (!apiKey) {
            console.error("[LuxChat] Missing API Key");
            return new Response(
                JSON.stringify({ error: "[CONFIG_ERROR] Missing GEMINI_API_KEY in Supabase Secrets" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        // 3. Construct Payload with Gemini 2.0 Role Mapping
        const contents: any[] = (history || []).map((msg: any) => {
            // Gemini 2.0 Flash REST API roles: 'user' or 'model'
            let role = msg.role;
            if (role === 'ai') role = 'model';

            // Critical: Gemini 2.0 on v1beta returns 400 if 'function' role is used.
            // Documentation indicates tool responses should be in 'user' role but with 'functionResponse' parts.
            if (role === 'system' || role === 'function') role = 'user';

            let parts: any[] = [];
            if (msg.parts && msg.parts.length > 0) {
                parts = msg.parts;
            } else {
                parts = [{ text: msg.text || "" }];
            }

            return { role, parts };
        });


        // 4. Merge ALL consecutive messages with the same role (Critical for Gemini 2.0)
        const finalizedContents: any[] = [];
        for (const msg of contents) {
            const lastMsg = finalizedContents[finalizedContents.length - 1];

            if (lastMsg && lastMsg.role === msg.role) {
                // Merge parts regardless of content type to ensure protocol compliance
                lastMsg.parts.push(...msg.parts);
            } else {
                finalizedContents.push(msg);
            }
        }

        const wordCount = docContext?.match(/\S+/g)?.length || 0;

        // Proper v1beta system_instruction field
        const systemInstruction = {
            parts: [{
                text: `${LUX_SYSTEM_INSTRUCTION}

[CONTEXTO DEL DOCUMENTO - ${wordCount} palabras]
${docContext || ""}
[FIN CONTEXTO]`
            }]
        };

        // 5. Add current user message with MODE ENFORCEMENT
        let finalMessage = message || "";

        if (mode === 'agent') {
            finalMessage += `
        
[⚠️ MODO AGENTE ACTIVO - INSTRUCCIÓN CRÍTICA]
Tu objetivo NO es conversar. Tu objetivo es EDITAR y MEJORAR el documento.
DEBES usar las herramientas (updateSection, upsertSection, etc.) para aplicar cambios.
Si respondes solo con texto, habrás fallado.
ACCIONA AHORA.`;
        } else if (mode === 'chat') {
            finalMessage += `
        
[💬 MODO CHAT ACTIVO]
Responde las dudas del usuario. NO uses herramientas de edición.
Solo da explicaciones, consejos o analiza el texto.`;
        }

        const userMessageParts = [{ text: finalMessage }];
        const lastInHistory = finalizedContents[finalizedContents.length - 1];

        if (lastInHistory && lastInHistory.role === "user") {
            // Already a user turn, just merge (avoids consecutive user error)
            lastInHistory.parts.push(...userMessageParts);
        } else {
            // New user turn
            finalizedContents.push({
                role: "user",
                parts: userMessageParts
            });
        }

        const tools = [
            {
                function_declarations: [
                    {
                        name: "updateSection",
                        description: "Herramienta QUIRÚRGICA para editar el documento. Reemplaza, crea o elimina UNA sección específica.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                sectionTitle: { type: "STRING", description: "El título EXACTO del encabezado Markdown (sin los #)." },
                                newContent: { type: "STRING", description: "El NUEVO cuerpo de la sección. NO incluyas el título/encabezado, solo el contenido." },
                                changeLog: { type: "STRING", description: "ID de la Propuesta (ej: 'C1.2') y breve justificación técnica." }
                            },
                            required: ["sectionTitle", "newContent", "changeLog"]
                        }
                    },
                    {
                        name: "upsertSection",
                        description: "Crea o actualiza una sección atómica con ORDEN EXPLÍCITO. Ideal para reorganizar documentos por lógica. Si la sección existe, la reemplaza; si no, la crea.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                sectionTitle: { type: "STRING", description: "Título de la sección (sin #)." },
                                content: { type: "STRING", description: "Cuerpo de la sección." },
                                orderIndex: { type: "NUMBER", description: "Número de orden (100, 200, 300...). Permite insertar secciones intermedias (ej: 150)." },
                                level: { type: "NUMBER", description: "Nivel del encabezado (2 = ##, 3 = ###). Default: 2." },
                                changeLog: { type: "STRING", description: "Justificación del cambio." }
                            },
                            required: ["sectionTitle", "content", "orderIndex", "changeLog"]
                        }
                    },
                    {
                        name: "reorderSections",
                        description: "Reorganiza el ORDEN de las secciones sin modificar su contenido. Útil para reestructuraciones lógicas.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                sections: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            sectionTitle: { type: "STRING" },
                                            newOrderIndex: { type: "NUMBER" }
                                        }
                                    },
                                    description: "Array de objetos con {sectionTitle, newOrderIndex}."
                                },
                                changeLog: { type: "STRING", description: "Justificación de la reorganización." }
                            },
                            required: ["sections", "changeLog"]
                        }
                    },
                    {
                        name: "list_github_files",
                        description: "Audita la estructura de archivos del repositorio.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                path: { type: "STRING", description: "Ruta del directorio relative al root." }
                            },
                            required: ["path"]
                        }
                    },
                    {
                        name: "read_github_files",
                        description: "Lee contenido de archivos (hasta 800k chars).",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                paths: { type: "ARRAY", items: { type: "STRING" }, description: "Array de rutas relativas." }
                            },
                            required: ["paths"]
                        }
                    },
                    {
                        name: "scanAndPatch",
                        description: "ESTRATEGIA SCAN→PATCH para documentos grandes (>50k chars). Fase 1 (SCAN): Analiza TODO el documento con 1M tokens de input. Fase 2 (PATCH): Devuelve SOLO las coordenadas y contenido de las secciones a modificar. NUNCA reescritura completa.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                patches: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            sectionTitle: { type: "STRING", description: "Título exacto de la sección a patchear." },
                                            operation: { type: "STRING", description: "REPLACE | INSERT_AFTER | INSERT_BEFORE | DELETE" },
                                            newContent: { type: "STRING", description: "Nuevo contenido para la sección (solo para REPLACE/INSERT)." }
                                        }
                                    },
                                    description: "Array de patches quirúrgicos a aplicar."
                                },
                                scanSummary: { type: "STRING", description: "Resumen del análisis global del documento." },
                                changelog: { type: "STRING", description: "Justificación de cada patch." }
                            },
                            required: ["patches", "changelog"]
                        }
                    },
                    {
                        name: "overwriteFullDocument",
                        description: "RECONSTRUCCIÓN TOTAL. Úsala cuando el documento esté desorganizado, tenga duplicados masivos o requiera un cambio estructural profundo. Reemplaza TODO el contenido actual.",
                        parameters: {
                            type: "OBJECT",
                            properties: {
                                newFullContent: { type: "STRING", description: "El contenido completo del documento en Markdown." },
                                changeLog: { type: "STRING", description: "Justificación de la reconstrucción total (ej: 'Reordenación estructural y eliminación de duplicados')." }
                            },
                            required: ["newFullContent", "changeLog"]
                        }
                    }
                ]
            }
        ];

        console.log("[LuxChat] Using Model: gemini-2.0-flash | Message:", message?.substring(0, 50));

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                const finalBody: any = {
                    system_instruction: systemInstruction,
                    contents: finalizedContents,
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 8192
                    }
                };

                // 6. Tool Injection Logic (Dependent on Mode)
                if(mode === 'agent') {
                    finalBody.tools = tools;
        // Optional: Force HIGH probability of tool use
        // finalBody.tool_config = { function_calling_config: { mode: "AUTO" } }; 
    }
        // In 'chat' mode, we simply DO NOT send 'tools', making it impossible for the model to use them.

        const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(finalBody)
        }
    );
}
);

if (!response.ok) {
    const errText = await response.text();
    console.error(`[LuxChat] Gemini API Error: ${response.status} - ${errText}`);
    return new Response(
        JSON.stringify({ error: `[GEMINI_ERROR] ${response.status}: ${errText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
}

const data = await response.json();
const candidate = data.candidates?.[0];
const parts = candidate?.content?.parts || [];

let text = "";
const functionCalls: any[] = [];

for (const part of parts) {
    if (part.text) text += part.text;
    if (part.functionCall) {
        functionCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args
        });
    }
}

console.log("[LuxChat] Success. Response length:", text.length, "Function Calls:", functionCalls.length);

return new Response(
    JSON.stringify({ text, functionCalls }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
);

    } catch (error: any) {
    console.error("[LuxChat] Fatal Top-Level Error:", error);
    return new Response(
        JSON.stringify({ error: `[FATAL_SERVER_ERROR] ${error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
}
});
