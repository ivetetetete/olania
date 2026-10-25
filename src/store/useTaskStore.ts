import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Priority = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pendiente' | 'completada';
export type PetCharacter = 'olaf' | 'lana';
export type PetPreference = 'auto' | 'olaf' | 'lana';
export type PetMood = 'happy' | 'grumpy' | 'sassy' | 'fierce';

export interface Task {
  id: string;
  title: string;
  context: string;
  priority: Priority;
  status: TaskStatus;
  nudgeCount: number;
  createdAt: number;
  lastNudgedAt: number;
  nextReminderAt: number;
  sourceUrl?: string;       // Link de Bluedot u origen
  completionNote?: string;  // Nota de avance al cerrar
}

// Intervalos reales de recordatorio según prioridad (en milisegundos)
export const PRIORITY_INTERVAL_MS: Record<Priority, number> = {
  alta: 30 * 60 * 1000,   // Cada 30 min
  media: 60 * 60 * 1000,  // Cada 1 hora (estándar)
  baja: 180 * 60 * 1000,  // Cada 3 horas
};

export const PRIORITY_LABELS: Record<Priority, { label: string; intervalText: string }> = {
  alta: { label: 'Alta', intervalText: 'Cada 30m' },
  media: { label: 'Media', intervalText: 'Cada 1h' },
  baja: { label: 'Baja', intervalText: 'Cada 3h' },
};

// Frases de Olaf (súper mono y cariñoso de entrada, pero saca carácter si le molestas posponiendo)
const OLAF_SWEET_QUIPS = [
  "¡Guau! 🐾 Vale, pasamos a la siguiente tarea entonces. ¿Qué tal esta?",
  "He traído otra pelotita de tu lista 🐶✨ ¿Esta sí la quitamos de en medio?",
  "Te dejo respirar con la anterior, pero mira lo que toca ahora 🦴",
];

const OLAF_GRUMPY_QUIPS = [
  "Grrr... 🐶💢 Ya le diste 'Aún no' varias veces. ¡A ver si con esta siguiente te animas!",
  "Me estás despeinando el mechón de tanto posponer tareas 😤 ¡Miremos la siguiente!",
  "¡Guau, guau! Paso a la siguiente de la cola, pero que sepas que la otra sigue apuntada 🐾🔥",
];

// Frases de Lana (gatita con mucho carácter, cañera y directa desde el minuto uno)
const LANA_SASSY_QUIPS = [
  "Miau. ¿Esa aún no? Pues no te escapas, aquí tienes la siguiente de tu lista 👀",
  "A ver, Project Manager: cambiamos de turno. ¿Esta tarea sí la vas a hacer ahora? 🐱💅",
  "Vale, la muevo al final de la fila... pero mira qué viene ahora 😼",
];

const LANA_FIERCE_QUIPS = [
  "¡MIAU! 😾🔥 Todo es 'aún no' contigo. ¡Haz al menos esta siguiente tarea AHORA MISMO!",
  "Te juro que tiro tu taza de café si pospones también esta otra 🐾⚡",
  "Código Rojo gatuno 😾: Te cambio de tarea, pero las tengo todas en mi radar.",
];

interface TaskState {
  tasks: Task[];
  activePet: PetCharacter;
  petPreference: PetPreference;
  petMood: PetMood;
  isResting: boolean;
  buddyMessage: string;
  focusedTaskId: string | null;
  customApiKey: string;

  // Acciones
  addTasks: (
    newTasks: Array<{
      title: string;
      priority: Priority;
      context: string;
      sourceUrl?: string;
    }>
  ) => void;
  postponeTask: (id: string) => void;
  completeTask: (id: string, note?: string) => void;
  changeTaskPriority: (id: string, priority: Priority) => void;
  deleteTask: (id: string) => void;
  setPetPreference: (pref: PetPreference) => void;
  setCustomApiKey: (key: string) => void;
  toggleRestMode: () => void;
  triggerScheduledNudge: (forceNow?: boolean) => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Obtiene la siguiente tarea en rotación (Round-Robin) para que nunca repita la misma si hay varias pendientes
function getNextRotatingTask(pendingTasks: Task[], currentId: string | null): Task | null {
  if (pendingTasks.length === 0) return null;
  if (pendingTasks.length === 1) return pendingTasks[0];

  const currentIndex = pendingTasks.findIndex((t) => t.id === currentId);
  if (currentIndex === -1) return pendingTasks[0];

  const nextIndex = (currentIndex + 1) % pendingTasks.length;
  return pendingTasks[nextIndex];
}

const nowInit = Date.now();

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [
        {
          id: 'welcome-1',
          title: 'Revisar acuerdos de la última reunión en Bluedot y enviar resumen al equipo',
          context: 'Proyecto Alpha',
          priority: 'alta',
          status: 'pendiente',
          nudgeCount: 1,
          createdAt: nowInit - 3600 * 1000,
          lastNudgedAt: nowInit - 1800 * 1000,
          nextReminderAt: nowInit + PRIORITY_INTERVAL_MS.alta,
          sourceUrl: 'https://app.bluedothq.com',
        },
        {
          id: 'welcome-2',
          title: 'Validar estimación de horas con el equipo de desarrollo para el Sprint',
          context: 'Planning Semanal',
          priority: 'media',
          status: 'pendiente',
          nudgeCount: 0,
          createdAt: nowInit - 7200 * 1000,
          lastNudgedAt: nowInit - 3600 * 1000,
          nextReminderAt: nowInit + PRIORITY_INTERVAL_MS.media,
        },
        {
          id: 'welcome-3',
          title: 'Enviar email de seguimiento a Albert con las fechas actualizadas',
          context: 'Cliente externo',
          priority: 'media',
          status: 'pendiente',
          nudgeCount: 0,
          createdAt: nowInit - 5000 * 1000,
          lastNudgedAt: nowInit - 4000 * 1000,
          nextReminderAt: nowInit + PRIORITY_INTERVAL_MS.media,
        },
      ],
      activePet: 'olaf',
      petPreference: 'auto',
      petMood: 'happy',
      isResting: false,
      buddyMessage:
        '¡Hola! Soy Olaf 🐶 (y Lana 🐱 anda vigilando). Péganos un link de Bluedot o tus notas de reunión y nos iremos turnando tus To-Dos.',
      focusedTaskId: 'welcome-1',
      customApiKey: '',

      addTasks: (newTasks) => {
        const now = Date.now();
        const created: Task[] = newTasks.map((t) => ({
          id: crypto.randomUUID(),
          title: t.title,
          context: t.context || 'General PM',
          priority: t.priority || 'media',
          status: 'pendiente',
          nudgeCount: 0,
          createdAt: now,
          lastNudgedAt: now,
          nextReminderAt: now + PRIORITY_INTERVAL_MS[t.priority || 'media'],
          sourceUrl: t.sourceUrl,
        }));

        const hasHigh = created.some((t) => t.priority === 'alta');
        const pref = get().petPreference;
        const nextPet: PetCharacter =
          pref === 'auto' ? (hasHigh ? 'lana' : 'olaf') : pref;

        set((state) => ({
          tasks: [...created, ...state.tasks],
          activePet: nextPet,
          petMood: nextPet === 'lana' ? (hasHigh ? 'fierce' : 'sassy') : 'happy',
          focusedTaskId: created[0]?.id || state.focusedTaskId,
          buddyMessage:
            nextPet === 'lana'
              ? `Miau 😼 He cazado ${created.length} tarea(s). Te las vamos a ir rotando hasta que no quede ni una.`
              : `¡Guau! 🐶✨ Ya apunté ${created.length} tarea(s) nuevas. Empezamos por la primera y nos vamos turnando.`,
        }));
      },

      postponeTask: (id) => {
        const now = Date.now();
        const state = get();
        const target = state.tasks.find((t) => t.id === id);
        if (!target) return;

        const newNudgeCount = target.nudgeCount + 1;
        const newPriority: Priority = newNudgeCount >= 3 ? 'alta' : target.priority;

        // Actualizar la tarea pospuesta y calcular cuál es la SIGUIENTE tarea en rotación
        const updatedTasks = state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                nudgeCount: newNudgeCount,
                priority: newPriority,
                lastNudgedAt: now,
                nextReminderAt: now + PRIORITY_INTERVAL_MS[newPriority],
              }
            : t
        );

        const pendingTasks = updatedTasks.filter((t) => t.status === 'pendiente');
        const nextTask = getNextRotatingTask(pendingTasks, id);
        const nextFocusedId = nextTask ? nextTask.id : id;

        // Elegir qué mascota responde y con qué humor
        let nextPet: PetCharacter = state.activePet;
        if (state.petPreference === 'auto') {
          nextPet = state.activePet === 'olaf' ? 'lana' : 'olaf';
        } else {
          nextPet = state.petPreference;
        }

        let nextMood: PetMood = 'happy';
        let message = '';

        const totalRepeated = (nextTask?.nudgeCount ?? 0) + newNudgeCount;

        if (nextPet === 'olaf') {
          if (newNudgeCount >= 2 || totalRepeated >= 3) {
            nextMood = 'grumpy';
            message = pickRandom(OLAF_GRUMPY_QUIPS);
          } else {
            nextMood = 'happy';
            message =
              pendingTasks.length > 1
                ? pickRandom(OLAF_SWEET_QUIPS)
                : 'Solo queda esta tarea pendiente 🐶💛 Te volveré a preguntar en un ratito.';
          }
        } else {
          if (newNudgeCount >= 2 || nextTask?.priority === 'alta') {
            nextMood = 'fierce';
            message = pickRandom(LANA_FIERCE_QUIPS);
          } else {
            nextMood = 'sassy';
            message = pickRandom(LANA_SASSY_QUIPS);
          }
        }

        set({
          tasks: updatedTasks,
          focusedTaskId: nextFocusedId,
          activePet: nextPet,
          petMood: nextMood,
          buddyMessage: message,
        });
      },

      completeTask: (id, note) => {
        const state = get();
        const pendingBefore = state.tasks.filter((t) => t.status === 'pendiente');
        const nextTask = getNextRotatingTask(pendingBefore, id);
        const nextFocus =
          nextTask && nextTask.id !== id ? nextTask.id : null;

        const isOlaf = state.activePet === 'olaf';
        set((prev) => ({
          tasks: prev.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completada', completionNote: note }
              : t
          ),
          focusedTaskId: nextFocus,
          petMood: isOlaf ? 'happy' : 'sassy',
          buddyMessage: isOlaf
            ? '¡SÍÍÍ! 🐶🎉 ¡Choca esa patita! Una menos, pasamos a la siguiente de la fila.'
            : 'Mmm, nada mal humana 🐱✨ Tachada. Aquí tienes la siguiente para que no pierdas el ritmo.',
        }));
      },

      changeTaskPriority: (id, priority) => {
        const now = Date.now();
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  priority,
                  nextReminderAt: now + PRIORITY_INTERVAL_MS[priority],
                }
              : t
          ),
          buddyMessage:
            priority === 'alta'
              ? '¡Oído! Prioridad ALTA 🔥 Te vamos a insistir cada 30 minutos con esto.'
              : priority === 'media'
              ? 'Prioridad MEDIA ⚡ Te preguntaremos cada 1 hora.'
              : 'Prioridad BAJA 🌱 Te daremos un toque suave cada 3 horas.',
        }));
      },

      deleteTask: (id) => {
        set((state) => {
          const remaining = state.tasks.filter((t) => t.id !== id);
          const pending = remaining.filter((t) => t.status === 'pendiente');
          return {
            tasks: remaining,
            focusedTaskId:
              state.focusedTaskId === id
                ? pending[0]?.id || null
                : state.focusedTaskId,
          };
        });
      },

      setPetPreference: (pref) => {
        const nextPet: PetCharacter =
          pref === 'auto' ? (get().activePet === 'olaf' ? 'lana' : 'olaf') : pref;
        set({
          petPreference: pref,
          activePet: nextPet,
          petMood: nextPet === 'olaf' ? 'happy' : 'sassy',
          buddyMessage:
            nextPet === 'olaf'
              ? '¡Guau! Turno de Olaf 🐶 Prometo portarme bien... si haces tus tareas a tiempo.'
              : 'Turno de Lana 🐱 Conmigo no valen las excusas de las reuniones, ¿entendido?',
        });
      },

      setCustomApiKey: (key) => {
        set({ customApiKey: key });
      },

      toggleRestMode: () => {
        const nextResting = !get().isResting;
        set({
          isResting: nextResting,
          petMood: 'happy',
          buddyMessage: nextResting
            ? 'Shhh... 🌙 Modo descanso activado. Olaf y Lana se han quedado dormidos juntitos para no sobreestimularte. Respira tranquila, aquí te esperamos sin hacer ruido 💤'
            : '¡Bostezo! 🐾☀️ Olaf y Lana ya se han despertado de la siesta. Cuando estés lista seguimos poquito a poco.',
        });
      },

      triggerScheduledNudge: (forceNow = false) => {
        const now = Date.now();
        const state = get();
        // Si está en Modo Descanso y no es forzado manualmente, no interrumpir nunca
        if (state.isResting && !forceNow) return;
        const pending = state.tasks.filter((t) => t.status === 'pendiente');
        if (pending.length === 0) return;

        // Comprobar si toca recordar (o si se forzó con "Simular aviso")
        const anyDue = pending.some((t) => forceNow || now >= t.nextReminderAt);
        if (!anyDue) return;

        // Rotar siempre a la siguiente tarea pendiente para que vayan turnándose
        const nextTask = getNextRotatingTask(pending, state.focusedTaskId) || pending[0];
        const nextNudgeCount = nextTask.nudgeCount + 1;

        let nextPet: PetCharacter = state.activePet;
        if (state.petPreference === 'auto') {
          nextPet = state.activePet === 'olaf' ? 'lana' : 'olaf';
        } else {
          nextPet = state.petPreference;
        }

        let nextMood: PetMood = 'happy';
        let message = '';

        if (nextPet === 'olaf') {
          nextMood = nextNudgeCount >= 2 ? 'grumpy' : 'happy';
          message =
            nextMood === 'grumpy'
              ? pickRandom(OLAF_GRUMPY_QUIPS)
              : pickRandom(OLAF_SWEET_QUIPS);
        } else {
          nextMood = nextTask.priority === 'alta' || nextNudgeCount >= 2 ? 'fierce' : 'sassy';
          message =
            nextMood === 'fierce'
              ? pickRandom(LANA_FIERCE_QUIPS)
              : pickRandom(LANA_SASSY_QUIPS);
        }

        set((prev) => ({
          tasks: prev.tasks.map((t) =>
            t.id === nextTask.id
              ? {
                  ...t,
                  nudgeCount: nextNudgeCount,
                  lastNudgedAt: now,
                  nextReminderAt: now + PRIORITY_INTERVAL_MS[t.priority],
                }
              : t
          ),
          activePet: nextPet,
          petMood: nextMood,
          focusedTaskId: nextTask.id,
          buddyMessage: message,
        }));
      },
    }),
    {
      name: 'olania-pm-buddy-v1',
    }
  )
);
