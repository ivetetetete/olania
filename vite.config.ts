import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import Anthropic from '@anthropic-ai/sdk';

interface ExtractedTask {
  title: string;
  priority: 'alta' | 'media' | 'baja';
  context: string;
  sourceUrl?: string;
}

// Extractor heurístico inteligente de respaldo por si aún no se ha puesto la ANTHROPIC_API_KEY
function fallbackExtractTasks(rawText: string, detectedUrl?: string): ExtractedTask[] {
  const cleaned = rawText
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim();

  // Si solo pegó un link de Bluedot sin texto adicional y no se pudo leer contenido privado
  if (!cleaned && detectedUrl) {
    return [
      {
        title: 'Revisar Action Items y acuerdos de la reunión en Bluedot',
        priority: 'alta',
        context: 'Reunión Bluedot',
        sourceUrl: detectedUrl,
      },
    ];
  }

  const lines = cleaned
    .split(/\n|(?<=[.!;])\s+|•|-|\*/)
    .map((l) => l.trim())
    .filter((l) => l.length > 6);

  // Detectar posible nombre de proyecto en el texto
  const projectMatch = rawText.match(/(?:proyecto|cliente|reunión|call|daily|weekly)\s+([A-ZÁÉÍÓÚa-záéíóú0-9_-]+)/i);
  const defaultContext = projectMatch ? `Proyecto ${projectMatch[1]}` : detectedUrl ? 'Reunión Bluedot' : 'General PM';

  const tasks: ExtractedTask[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    let priority: 'alta' | 'media' | 'baja' = 'media';
    if (/(urgente|hoy|asap|crítico|bloqueo|bloqueado|importante|ya|viernes|cliente)/i.test(lower)) {
      priority = 'alta';
    } else if (/(cuando puedas|baja|futuro|algún día|opcional|luego)/i.test(lower)) {
      priority = 'baja';
    }

    tasks.push({
      title: line.charAt(0).toUpperCase() + line.slice(1).replace(/\.$/, ''),
      priority,
      context: defaultContext,
      ...(detectedUrl ? { sourceUrl: detectedUrl } : {}),
    });
  }

  return tasks.slice(0, 8);
}

// Intenta extraer texto público o metadatos de un enlace de Bluedot
async function tryFetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
    });
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    return [
      titleMatch ? `Título de reunión: ${titleMatch[1]}` : '',
      descMatch ? `Resumen: ${descMatch[1]}` : '',
      bodyText ? `Contenido extraído: ${bodyText}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  } catch {
    return '';
  }
}

function olaniaApiPlugin(envApiKey?: string): Plugin {
  return {
    name: 'olania-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/parse-notes', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const { rawText, customApiKey, bluedotDomText } = JSON.parse(body || '{}');
            if (!rawText || typeof rawText !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Se requiere texto o link de Bluedot.' }));
              return;
            }

            // Detectar si hay un link (por ejemplo de Bluedot)
            const urlMatch = rawText.match(/https?:\/\/[^\s]+/i);
            const detectedUrl = urlMatch ? urlMatch[0] : undefined;

            let enrichedText = rawText;
            if (bluedotDomText) {
              enrichedText += `\n\n[Contenido extraído de Bluedot]:\n${bluedotDomText}`;
            } else if (detectedUrl) {
              const fetchedContent = await tryFetchUrlContent(detectedUrl);
              if (fetchedContent) {
                enrichedText += `\n\n[Contenido extraído del enlace]:\n${fetchedContent}`;
              }
            }

            const activeApiKey = (customApiKey || envApiKey || process.env.ANTHROPIC_API_KEY || '').trim();

            if (!activeApiKey || activeApiKey === 'sk-ant-api03-...') {
              const fallbackTasks = fallbackExtractTasks(rawText, detectedUrl);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  tasks: fallbackTasks,
                  mode: 'local-heuristic',
                  message: 'Procesado en modo local (añade tu Claude API Key en ⚙️ para análisis IA avanzado).',
                })
              );
              return;
            }

            const anthropic = new Anthropic({ apiKey: activeApiKey });

            const response = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-latest',
              max_tokens: 1024,
              temperature: 0.1,
              system: `Eres Olania (formada por Olaf el perrito y Lana la gatita), el asistente ejecutivo implacable de una Project Manager que gestiona múltiples proyectos a la vez.
Tu misión es analizar notas crudas de reuniones, resúmenes de Bluedot, transcripciones o mensajes de Slack y extraer ÚNICAMENTE las tareas accionables ("To-Do" o "Follow-ups") para la Project Manager.
- Redacta cada tarea empezando con un verbo en infinitivo claro y accionable (ej. "Enviar presupuesto actualizado a cliente", "Hacer seguimiento con DevOps sobre entorno QA").
- Identifica el proyecto o reunión en 'context' (ej. "Proyecto Alpha", "Reunión Bluedot").
- Asigna la prioridad ('alta', 'media', 'baja') según urgencia, bloqueos o fechas límite.`,
              tools: [
                {
                  name: 'extract_pm_tasks',
                  description: 'Extrae tareas accionables de PM a partir de texto o resúmenes de Bluedot.',
                  input_schema: {
                    type: 'object',
                    properties: {
                      tasks: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            priority: { type: 'string', enum: ['alta', 'media', 'baja'] },
                            context: { type: 'string' },
                          },
                          required: ['title', 'priority', 'context'],
                        },
                      },
                    },
                    required: ['tasks'],
                  },
                },
              ],
              tool_choice: { type: 'tool', name: 'extract_pm_tasks' },
              messages: [
                {
                  role: 'user',
                  content: `Extrae los To-Dos y tareas de seguimiento para la Project Manager de esta entrada:\n\n"""${enrichedText}"""`,
                },
              ],
            });

            const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
            if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
              throw new Error('Claude no devolvió el bloque tool_use esperado');
            }

            const inputData = toolUseBlock.input as { tasks: ExtractedTask[] };
            const tasksWithUrl = (inputData.tasks || []).map((t) => ({
              ...t,
              ...(detectedUrl ? { sourceUrl: detectedUrl } : {}),
            }));

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ tasks: tasksWithUrl, mode: 'claude-ai' }));
          } catch (err: any) {
            console.error('Error en /api/parse-notes:', err);
            // Si falla la API key o red, no bloqueamos a la PM: usamos el extractor heurístico de respaldo
            try {
              const parsed = JSON.parse(body || '{}');
              const urlMatch = (parsed.rawText || '').match(/https?:\/\/[^\s]+/i);
              const fallbackTasks = fallbackExtractTasks(parsed.rawText || '', urlMatch ? urlMatch[0] : undefined);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  tasks: fallbackTasks,
                  mode: 'fallback',
                  warning: err?.message || 'Error contactando con Claude API, usado extractor rápido.',
                })
              );
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Error procesando notas' }));
            }
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [react(), olaniaApiPlugin(env.ANTHROPIC_API_KEY)],
  };
});
