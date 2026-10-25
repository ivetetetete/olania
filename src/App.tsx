import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  useTaskStore,
  Priority,
  PRIORITY_LABELS,
  Task,
  PetPreference,
} from './store/useTaskStore';
import { PetAvatar } from './components/PetAvatar';
import { LandingPage } from './components/LandingPage';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  FolderKanban,
  Send,
  ExternalLink,
  ClipboardPaste,
  BellRing,
  Settings,
  ChevronDown,
  Video,
  Trash2,
  History,
  KeyRound,
  Download,
  Plus,
  X,
  ListTodo,
  Moon,
  Sun,
} from 'lucide-react';

declare global {
  interface Window {
    olaniaElectron?: {
      isElectron: boolean;
      openExternal: (url: string) => Promise<void>;
      loginBluedot: () => Promise<{ ok: boolean }>;
      scrapeBluedot: (url: string) => Promise<{ text: string; error?: string }>;
      setIgnoreMouseEvents?: (ignore: boolean) => void;
      onTogglePanel: (cb: () => void) => void;
    };
  }
}

// Extractor local de respaldo en el propio cliente (para que funcione incluso offline como PWA instalada)
function clientSideFallbackExtract(rawText: string) {
  const urlMatch = rawText.match(/https?:\/\/[^\s]+/i);
  const detectedUrl = urlMatch ? urlMatch[0] : undefined;
  const cleaned = rawText.replace(/https?:\/\/[^\s]+/g, '').trim();

  if (!cleaned && detectedUrl) {
    return [
      {
        title: 'Revisar Action Items y acuerdos de la reunión en Bluedot',
        priority: 'alta' as Priority,
        context: 'Reunión Bluedot',
        sourceUrl: detectedUrl,
      },
    ];
  }

  const projectMatch = rawText.match(
    /(?:proyecto|cliente|reunión|call|daily|weekly)\s+([A-ZÁÉÍÓÚa-záéíóú0-9_-]+)/i
  );
  const defaultContext = projectMatch
    ? `Proyecto ${projectMatch[1]}`
    : detectedUrl
    ? 'Reunión Bluedot'
    : 'General PM';

  const lines = cleaned
    .split(/\n|(?<=[.!;])\s+|•|-|\*/)
    .map((l) => l.trim())
    .filter((l) => l.length > 4);

  return lines.slice(0, 8).map((line) => {
    const lower = line.toLowerCase();
    let priority: Priority = 'media';
    if (/(urgente|hoy|asap|crítico|bloqueo|bloqueado|importante|ya|viernes|cliente)/i.test(lower)) {
      priority = 'alta';
    } else if (/(cuando puedas|baja|futuro|algún día|opcional|luego)/i.test(lower)) {
      priority = 'baja';
    }
    return {
      title: line.charAt(0).toUpperCase() + line.slice(1).replace(/\.$/, ''),
      priority,
      context: defaultContext,
      ...(detectedUrl ? { sourceUrl: detectedUrl } : {}),
    };
  });
}

export default function App() {
  const {
    tasks,
    activePet,
    petPreference,
    petMood,
    isResting,
    buddyMessage,
    focusedTaskId,
    customApiKey,
    addTasks,
    postponeTask,
    completeTask,
    changeTaskPriority,
    deleteTask,
    setPetPreference,
    setCustomApiKey,
    toggleRestMode,
    triggerScheduledNudge,
  } = useTaskStore();

  const isElectronMode =
    typeof window !== 'undefined' &&
    (Boolean(window.olaniaElectron?.isElectron) ||
      window.location.search.includes('electron=1'));

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [rawInput, setRawInput] = useState('');
  const [isFeeding, setIsFeeding] = useState(false);
  const [isDraggingOverPet, setIsDraggingOverPet] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Reloj interno de Olania: comprueba cada 30 segundos si alguna tarea ha cumplido su intervalo (30m / 1h / 3h)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useTaskStore.getState();
      if (state.isResting) return;

      const now = Date.now();
      const hasDueTask = state.tasks.some(
        (t) => t.status === 'pendiente' && now >= t.nextReminderAt
      );
      if (hasDueTask) {
        triggerScheduledNudge(false);
        setIsBubbleVisible(true);
      }
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [triggerScheduledNudge]);

  // Escuchar atajo global Cmd+Shift+O desde Electron
  useEffect(() => {
    if (window.olaniaElectron?.onTogglePanel) {
      window.olaniaElectron.onTogglePanel(() => {
        setIsDrawerOpen((prev) => !prev);
        setIsQuickMenuOpen(false);
        setIsBubbleVisible(true);
      });
    }
  }, []);

  // En Electron (macOS): permitir que los clics atraviesen todas las zonas transparentes hacia las apps de debajo
  useEffect(() => {
    if (!window.olaniaElectron?.setIgnoreMouseEvents) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const isOverInteractiveWidget = Boolean(
        target && target.closest('.olania-interactive')
      );
      window.olaniaElectron?.setIgnoreMouseEvents?.(!isOverInteractiveWidget);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4000);
  };

  const handleInstallPwa = async () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      const { outcome } = await deferredPwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPwaPrompt(null);
        showToast('🎉 ¡Olania instalada como WebApp en tu Mac!');
      }
    } else {
      setShowInstallHelp(true);
    }
  };

  // Alimentar a Olania con texto o un link de Bluedot
  const feedOlania = async (textToProcess: string) => {
    const trimmed = textToProcess.trim();
    if (!trimmed) return;

    setIsFeeding(true);
    setIsBubbleVisible(true);
    setIsQuickMenuOpen(false);

    try {
      let bluedotDomText = '';
      const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
      const detectedUrl = urlMatch ? urlMatch[0] : undefined;

      if (
        detectedUrl &&
        detectedUrl.includes('bluedot') &&
        window.olaniaElectron?.scrapeBluedot
      ) {
        showToast('🎥 Leyendo resumen y Action Items de Bluedot...');
        const scraped = await window.olaniaElectron.scrapeBluedot(detectedUrl);
        if (scraped?.text) {
          bluedotDomText = scraped.text;
        }
      }

      const res = await fetch('/api/parse-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: trimmed,
          customApiKey,
          bluedotDomText,
        }),
      });

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        addTasks(data.tasks);
        setRawInput('');
        showToast(
          `🍖 ¡Ñam! ${activePet === 'olaf' ? 'Olaf' : 'Lana'} ha extraído ${
            data.tasks.length
          } tarea(s).`
        );
      } else {
        showToast('No detecté tareas claras en ese texto.');
      }
    } catch {
      if (customApiKey && customApiKey.startsWith('sk-ant-')) {
        try {
          const urlMatch = trimmed.match(/https?:\/\/[^\s]+/i);
          const detectedUrl = urlMatch ? urlMatch[0] : undefined;
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': customApiKey.trim(),
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-latest',
              max_tokens: 1024,
              temperature: 0.1,
              system:
                'Eres Olania, asistente de una Project Manager. Extrae tareas accionables usando la herramienta extract_pm_tasks.',
              tools: [
                {
                  name: 'extract_pm_tasks',
                  description: 'Extrae tareas accionables de PM.',
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
                  content: `Extrae las tareas pendientes de esta entrada:\n\n"""${trimmed}"""`,
                },
              ],
            }),
          });
          const claudeData = await claudeRes.json();
          const toolBlock = claudeData?.content?.find((b: any) => b.type === 'tool_use');
          if (toolBlock?.input?.tasks?.length) {
            const extracted = toolBlock.input.tasks.map((t: any) => ({
              ...t,
              ...(detectedUrl ? { sourceUrl: detectedUrl } : {}),
            }));
            addTasks(extracted);
            setRawInput('');
            showToast(`🍖 ¡Ñam! Extraídas ${extracted.length} tarea(s) con Claude IA.`);
            return;
          }
        } catch (e) {
          console.error('Error directo Claude:', e);
        }
      }

      const fallback = clientSideFallbackExtract(trimmed);
      if (fallback.length > 0) {
        addTasks(fallback);
        setRawInput('');
        showToast(`🍖 Extraídas ${fallback.length} tarea(s) en modo local.`);
      }
    } finally {
      setIsFeeding(false);
    }
  };

  const handleFeedFromClipboard = async () => {
    setIsQuickMenuOpen(false);
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        showToast('Tu portapapeles está vacío. Copia primero un texto o link de Bluedot.');
        return;
      }
      await feedOlania(clipText);
    } catch {
      setIsDrawerOpen(true);
      showToast('Pega aquí tu texto o link con Cmd+V');
    }
  };

  const handleDropOnPet = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverPet(false);

    const droppedText =
      e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');

    if (droppedText) {
      await feedOlania(droppedText);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const text = await file.text();
      if (text) await feedOlania(text);
    }
  };

  const handleConfirmComplete = (id: string) => {
    completeTask(id, completionNote.trim() || undefined);
    setCompletingTaskId(null);
    setCompletionNote('');
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { x: 0.85, y: 0.85 },
    });
  };

  const openExternalUrl = (url: string) => {
    if (window.olaniaElectron?.openExternal) {
      window.olaniaElectron.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Mantener el orden de cola para que la rotación (Turno 1 -> Turno 2 -> Turno 3) sea predecible
  const pendingTasks = tasks.filter((t) => t.status === 'pendiente');
  const completedTasks = tasks.filter((t) => t.status === 'completada');

  const spotlightIndex = Math.max(
    0,
    pendingTasks.findIndex((t) => t.id === focusedTaskId)
  );
  const spotlightTask: Task | undefined = pendingTasks[spotlightIndex];

  const getPriorityBadgeStyle = (p: Priority) => {
    if (p === 'alta') return 'bg-rose-100 text-rose-700 border-rose-300';
    if (p === 'media') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  };

  return (
    <div
      className={`min-h-screen w-full relative font-sans ${
        isElectronMode
          ? 'bg-transparent'
          : 'bg-gradient-to-br from-stone-100 via-orange-50/40 to-violet-100/50'
      }`}
    >
      {/* MODO WEB COMERCIAL EN NAVEGADOR: Landing Page completa + Demo interactiva */}
      {!isElectronMode && (
        <>
          {showInstallHelp && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full mx-4 bg-violet-950 text-violet-50 p-5 rounded-3xl shadow-2xl space-y-2.5 text-xs animate-popIn border border-violet-700">
              <div className="flex items-center justify-between">
                <strong className="text-sm text-white">
                  📲 Cómo instalar Olania en tu ordenador (1 clic):
                </strong>
                <button
                  onClick={() => setShowInstallHelp(false)}
                  className="text-violet-300 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-violet-100">
                <li>
                  <strong>En Chrome / Brave / Edge:</strong> Haz clic en el icono de{' '}
                  <strong>Instalar (pantalla con flecha 📥)</strong> a la derecha de la barra de
                  direcciones arriba, o ve al menú{' '}
                  <code>⋮ → Guardar y compartir → Instalar Olania...</code>
                </li>
                <li>
                  <strong>En Safari (macOS Sonoma+):</strong> Ve arriba a{' '}
                  <code>Archivo → Añadir al Dock...</code>
                </li>
                <li>
                  <strong>App Nativa macOS:</strong> Ya tienes <code>Olania.app</code> lista en tu
                  carpeta <code>/Users/ivettesanjurjo/Developer/Projects/olania</code>.
                </li>
                <li>
                  <strong>En Linux (Pop!_OS):</strong> Pulsa el botón{' '}
                  <strong>“🐧 Descargar para Linux (Pop!_OS)”</strong> de la web para bajar el
                  instalador con icono para tu menú y Dock.
                </li>
              </ul>
            </div>
          )}

          <LandingPage
            onInstallPwa={handleInstallPwa}
            onFeedSample={(sampleText) => feedOlania(sampleText)}
            onTriggerDemoNudge={() => {
              triggerScheduledNudge(true);
              setIsBubbleVisible(true);
            }}
            onToggleRestMode={() => {
              const willRest = !isResting;
              toggleRestMode();
              setIsBubbleVisible(!willRest);
            }}
            isResting={isResting}
          />
        </>
      )}

      {/* =====================================================================
          WIDGET FLOTANTE EN LA ESQUINA INFERIOR DERECHA (OLAF & LANA)
         ===================================================================== */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end max-w-[385px] w-full pointer-events-none px-2">
        {statusToast && (
          <div className="olania-interactive pointer-events-auto mb-2 bg-stone-900/95 text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-lg animate-popIn">
            {statusToast}
          </div>
        )}

        {/* CAJÓN DESPLEGABLE COMPLETO (ALIMENTAR + LISTA DE TAREAS + AJUSTES) */}
        {isDrawerOpen && (
          <div className="olania-interactive pointer-events-auto w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-stone-200/90 mb-3 overflow-hidden flex flex-col max-h-[480px] animate-popIn">
            <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight">
                  🐾 Olania ({pendingTasks.length} pendientes)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const order: PetPreference[] = ['auto', 'olaf', 'lana'];
                    const next = order[(order.indexOf(petPreference) + 1) % order.length];
                    setPetPreference(next);
                  }}
                  title="Cambiar entre modo Automático, solo Olaf o solo Lana"
                  className="text-[11px] bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                >
                  {petPreference === 'auto'
                    ? '🔄 Auto (Olaf+Lana)'
                    : petPreference === 'olaf'
                    ? '🐶 Solo Olaf'
                    : '🐱 Solo Lana'}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configurar Claude API Key y conexión Bluedot"
                  className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {showSettings && (
              <div className="p-3.5 bg-stone-100 border-b border-stone-200 space-y-2.5 text-xs">
                <div className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-violet-600" />
                  Clave de API de Anthropic (Claude)
                </div>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="sk-ant-api03-... (Opcional: usa heurística local si está vacío)"
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-500">
                    ¿Tus vídeos de Bluedot son privados?
                  </span>
                  <button
                    onClick={() => {
                      if (window.olaniaElectron?.loginBluedot) {
                        window.olaniaElectron.loginBluedot();
                      } else {
                        window.open('https://app.bluedothq.com', '_blank');
                      }
                    }}
                    className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
                  >
                    <Video className="w-3 h-3" /> Conectar Bluedot
                  </button>
                </div>
              </div>
            )}

            <div className="p-3.5 border-b border-stone-100 bg-stone-50/60">
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Pega aquí un link de Bluedot o tus tareas (ej. una por línea)..."
                rows={2}
                className="w-full resize-none rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-violet-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    feedOlania(rawInput);
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-stone-400">
                  Se irán turnando automáticamente
                </span>
                <button
                  onClick={() => feedOlania(rawInput)}
                  disabled={isFeeding || !rawInput.trim()}
                  className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-stone-300 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isFeeding ? 'Olfateando To-Dos...' : 'Añadir tareas'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-400">
                  ¡No tienes nada pendiente! Olaf y Lana están echando la siesta 💤
                </div>
              ) : (
                pendingTasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-2xl border transition ${
                      t.id === spotlightTask?.id
                        ? 'bg-violet-50/50 border-violet-300'
                        : 'bg-white border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-stone-400">
                          #{idx + 1}
                        </span>
                        <select
                          value={t.priority}
                          onChange={(e) =>
                            changeTaskPriority(t.id, e.target.value as Priority)
                          }
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${getPriorityBadgeStyle(
                            t.priority
                          )}`}
                        >
                          <option value="alta">🔥 Alta (Cada 30m)</option>
                          <option value="media">⚡ Media (Cada 1h)</option>
                          <option value="baja">🌱 Baja (Cada 3h)</option>
                        </select>

                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full mx-1">
                          <FolderKanban className="w-2.5 h-2.5" />
                          {t.context}
                        </span>

                        {t.nudgeCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded-full">
                            <Flame className="w-2.5 h-2.5" /> {t.nudgeCount}x
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {t.sourceUrl && (
                          <button
                            onClick={() => openExternalUrl(t.sourceUrl!)}
                            title="Abrir grabación de Bluedot"
                            className="p-1 text-violet-600 hover:bg-violet-50 rounded-lg"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTask(t.id)}
                          title="Eliminar tarea"
                          className="p-1 text-stone-300 hover:text-rose-500 rounded-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-stone-800 leading-snug">
                      {t.title}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        onClick={() => postponeTask(t.id)}
                        className="text-[11px] font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        ⏳ Aún no (Siguiente)
                      </button>
                      <button
                        onClick={() => handleConfirmComplete(t.id)}
                        className="text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        ✅ Hecho
                      </button>
                    </div>
                  </div>
                ))
              )}

              {completedTasks.length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-600"
                  >
                    <History className="w-3 h-3" />
                    {showCompleted
                      ? 'Ocultar completadas'
                      : `Ver ${completedTasks.length} completada(s)`}
                  </button>
                  {showCompleted && (
                    <div className="mt-1.5 space-y-1">
                      {completedTasks.map((c) => (
                        <div
                          key={c.id}
                          className="text-[11px] text-stone-400 bg-stone-50 px-2.5 py-1.5 rounded-lg flex justify-between"
                        >
                          <span className="line-through truncate">{c.title}</span>
                          {c.completionNote && (
                            <span className="italic ml-2 flex-shrink-0">
                              “{c.completionNote}”
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOCADILLO DE CÓMIC FLOTANTE ENCIMA DE LA MASCOTA */}
        {isBubbleVisible && (
          <div
            className={`olania-interactive pointer-events-auto relative w-full backdrop-blur-md rounded-3xl p-4 shadow-xl border-2 mb-3 animate-popIn ${
              isResting
                ? 'bg-indigo-950/95 text-indigo-50 border-indigo-800/60'
                : 'bg-white/95 text-stone-800 border-stone-800/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  isResting ? 'text-indigo-200' : 'text-violet-700'
                }`}
              >
                {isResting
                  ? '🌙 Olaf y Lana durmiendo juntos'
                  : activePet === 'olaf'
                  ? petMood === 'grumpy'
                    ? '🐶 Olaf (Enfadado contigo)'
                    : '🐶 Olaf (Tu perrito PM)'
                  : petMood === 'fierce'
                  ? '🐱 Lana (Modo Fiera Activado)'
                  : '🐱 Lana (Vigilando tus To-Dos)'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const willRest = !isResting;
                    toggleRestMode();
                    if (willRest) {
                      setIsBubbleVisible(false);
                    }
                  }}
                  title={
                    isResting
                      ? 'Despertar a Olaf y Lana'
                      : 'Pausar notificaciones y poner a Olaf y Lana a dormir juntos'
                  }
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                    isResting
                      ? 'bg-amber-400 text-stone-950 hover:bg-amber-300'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  {isResting ? (
                    <>
                      <Sun className="w-3 h-3" /> Despertar
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3" /> Descanso
                    </>
                  )}
                </button>
                {!isResting && pendingTasks.length > 1 && (
                  <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                    Turno {spotlightIndex + 1}/{pendingTasks.length}
                  </span>
                )}
                <button
                  onClick={() => setIsBubbleVisible(false)}
                  className="text-[10px] text-stone-400 hover:text-stone-600 font-medium px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <p
              className={`text-xs font-medium leading-relaxed ${
                isResting ? 'text-indigo-100' : 'text-stone-800'
              }`}
            >
              “{buddyMessage}”
            </p>

            {!isResting && spotlightTask && (
              <div className="mt-3 pt-2.5 border-t border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={spotlightTask.priority}
                      onChange={(e) =>
                        changeTaskPriority(
                          spotlightTask.id,
                          e.target.value as Priority
                        )
                      }
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border cursor-pointer mx-1 ${getPriorityBadgeStyle(
                        spotlightTask.priority
                      )}`}
                    >
                      <option value="alta">
                        🔥 Alta ({PRIORITY_LABELS.alta.intervalText})
                      </option>
                      <option value="media">
                        ⚡ Media ({PRIORITY_LABELS.media.intervalText})
                      </option>
                      <option value="baja">
                        🌱 Baja ({PRIORITY_LABELS.baja.intervalText})
                      </option>
                    </select>
                    <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                      {spotlightTask.context}
                    </span>
                  </div>

                  {spotlightTask.sourceUrl && (
                    <button
                      onClick={() => openExternalUrl(spotlightTask.sourceUrl!)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 px-2 py-0.5 rounded-full cursor-pointer"
                    >
                      <Video className="w-3 h-3" /> Bluedot
                    </button>
                  )}
                </div>

                <p className="text-xs font-bold text-stone-900 leading-snug">
                  👉 {spotlightTask.title}
                </p>

                {completingTaskId !== spotlightTask.id ? (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => postponeTask(spotlightTask.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Aún no {pendingTasks.length > 1 ? '(Siguiente)' : ''}
                    </button>
                    <button
                      onClick={() => setCompletingTaskId(spotlightTask.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ¡Hecho!
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 space-y-1.5">
                    <input
                      type="text"
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      placeholder="Nota opcional (ej: 'Enviado por Slack')..."
                      className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleConfirmComplete(spotlightTask.id)
                      }
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setCompletingTaskId(null)}
                        className="text-[11px] text-stone-400 hover:text-stone-600 px-2 py-1"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleConfirmComplete(spotlightTask.id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-semibold px-3 py-1 rounded-xl hover:bg-emerald-500 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Confirmar cierre
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-r-2 border-b-2 border-stone-800/10 rotate-45"></div>
          </div>
        )}

        {/* FILA INFERIOR SUPER COMPACTA: UN ÚNICO BOTÓN DESPLEGABLE + AVATAR DE OLAF/LANA */}
        <div className="olania-interactive pointer-events-auto relative flex items-end gap-2">
          {/* Menú desplegable compacto cuando se pulsa el botón único */}
          {isQuickMenuOpen && (
            <div className="absolute bottom-12 right-24 mb-1 w-48 bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 animate-popIn z-30">
              <button
                onClick={() => {
                  setIsDrawerOpen(!isDrawerOpen);
                  setIsQuickMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 text-left text-xs font-semibold text-stone-800 hover:bg-violet-50 hover:text-violet-700 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <ListTodo className="w-3.5 h-3.5 text-violet-600" />
                Alimentar / Lista ({pendingTasks.length})
              </button>

              <button
                onClick={handleFeedFromClipboard}
                className="w-full flex items-center gap-2 text-left text-xs font-semibold text-stone-800 hover:bg-violet-50 hover:text-violet-700 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-violet-600" />
                Tragar lo copiado
              </button>

              <button
                onClick={() => {
                  const willRest = !isResting;
                  toggleRestMode();
                  setIsBubbleVisible(!willRest);
                  setIsQuickMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 text-left text-xs font-semibold text-stone-800 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                {isResting ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    ☀️ Despertar del descanso
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    🌙 Modo descanso (Pausar)
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  triggerScheduledNudge(true);
                  setIsBubbleVisible(true);
                  setIsQuickMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 text-left text-xs font-semibold text-stone-800 hover:bg-amber-50 hover:text-amber-700 px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-500" />
                Siguiente / Simular aviso
              </button>
            </div>
          )}

          {/* Único botón compacto junto a la mascota */}
          <button
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
            title="Abrir opciones de Olania"
            className="mb-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white hover:bg-gray-300 text-gray-900 shadow-lg transition cursor-pointer"
          >
            {isQuickMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>

          {/* Avatar de Olaf / Lana */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOverPet(true);
            }}
            onDragLeave={() => setIsDraggingOverPet(false)}
            onDrop={handleDropOnPet}
            onClick={() => {
              if (!isBubbleVisible) {
                setIsBubbleVisible(true);
              } else if (!isResting) {
                setPetPreference(activePet === 'olaf' ? 'lana' : 'olaf');
              }
            }}
            title="Haz clic para alternar entre Olaf 🐶 y Lana 🐱, o arrastra aquí un link de Bluedot / notas"
            className="relative cursor-pointer group"
          >
            {isDraggingOverPet && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md animate-bounce z-20">
                🍖 ¡Suéltalo para comer!
              </div>
            )}

            <PetAvatar
              pet={activePet}
              mood={petMood}
              size="lg"
              isEating={isFeeding || isDraggingOverPet}
              isResting={isResting}
            />

            {!isResting && pendingTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                {pendingTasks.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
