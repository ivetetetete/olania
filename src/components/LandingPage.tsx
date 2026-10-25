import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Video,
  Clock,
  Moon,
  CheckCircle2,
  Flame,
  RefreshCw,
  ShieldCheck,
  Laptop,
  Heart,
  ArrowDownRight,
  ClipboardPaste,
} from 'lucide-react';

interface LandingPageProps {
  onInstallPwa: () => void;
  onFeedSample: (text: string) => void;
  onTriggerDemoNudge: () => void;
  onToggleRestMode: () => void;
  isResting: boolean;
}

const CHARACTER_SHOWCASE = [
  {
    id: 'olaf-happy',
    name: 'Olaf (Modo Cariñoso)',
    badge: '🐶 Cada 1h • Prioridad Media',
    img: './pets/olaf-happy.png',
    quote:
      '“¡Guau! 🐾 He traído esta tarea de tu lista. Cuando tengas un huequito la miramos, ¿vale? Te espero aquí sentado.”',
    desc: 'Tu compañero fiel y adorable del día a día. Te recuerda las cosas con dulzura para que avances sin agobios.',
    color: 'from-sky-50 to-violet-50 border-violet-200',
  },
  {
    id: 'lana-sassy',
    name: 'Lana (Con Carácter)',
    badge: '🐱 Directa • Sin Excusas',
    img: './pets/lana-sassy.png',
    quote:
      '“Miau. Te estoy mirando fijamente con mis ojazos 👀 Menos abrir pestañas nuevas y más cerrar este pendiente.”',
    desc: 'Pequeña pero implacable. Entra en acción para que ningún seguimiento de cliente o bloqueo del equipo se quede en el limbo.',
    color: 'from-amber-50 to-orange-50 border-amber-200',
  },
  {
    id: 'olaf-grumpy',
    name: 'Olaf (Cuando le molestas)',
    badge: '🐶💢 Tras posponer varias veces',
    img: './pets/olaf-grumpy.png',
    quote:
      '“Grrr... Soy muy bueno, pero ya me has dicho ‘Aún no’ tres veces seguidas. ¡Me estás despeinando el mechón!”',
    desc: 'Aunque es súper mono, si abusas del botón de posponer saca su carácter y frunce el ceño hasta que le hagas caso.',
    color: 'from-rose-50 to-pink-50 border-rose-200',
  },
  {
    id: 'lana-fierce',
    name: 'Lana (Modo Fiera)',
    badge: '😾🔥 Prioridad Alta • Cada 30m',
    img: './pets/lana-fierce.png',
    quote:
      '“¡Código Rojo gatuno! 😾🔥 O mandas ese entregable urgente AHORA MISMO o te juro que tiro tu taza de café de la mesa.”',
    desc: 'Para fuegos reales de Project Management. Insiste cada 30 minutos hasta que completas la tarea con su nota de cierre.',
    color: 'from-red-50 to-orange-100/70 border-red-300',
  },
  {
    id: 'olania-sleeping',
    name: 'Modo Descanso (Cero Estrés)',
    badge: '🌙 Anti-Sobreestimulación',
    img: './pets/olania-sleeping.png',
    quote:
      '“Shhh... 💤 Olaf y Lana se han quedado dormidos juntitos. Cero notificaciones hasta que tú decidas despertarlos.”',
    desc: 'Porque una PM también necesita foco profundo y paz mental. Con un clic se acurrucan juntos y silencian todos los avisos.',
    color: 'from-indigo-950 to-violet-950 text-indigo-50 border-indigo-700',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onInstallPwa,
  onFeedSample,
  onTriggerDemoNudge,
  onToggleRestMode,
  isResting,
}) => {
  const [selectedChar, setSelectedChar] = useState(0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-violet-200 pb-36">
      {/* BARRA DE NAVEGACIÓN COMERCIAL */}
      <nav className="sticky top-0 z-30 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img
                src="./pets/olaf-happy.png"
                alt="Olaf"
                className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
              />
              <img
                src="./pets/lana-sassy.png"
                alt="Lana"
                className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
              />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-stone-900">
                Olania
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                PM Desktop Buddy
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-600">
            <a href="#como-funciona" className="hover:text-stone-900 transition">
              Cómo funciona
            </a>
            <a href="#personajes" className="hover:text-stone-900 transition">
              Olaf y Lana
            </a>
            <a href="#bluedot-ai" className="hover:text-stone-900 transition">
              Bluedot + Claude IA
            </a>
            <a href="#descargar" className="hover:text-stone-900 transition">
              Descargas
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onInstallPwa}
              className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar WebApp
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative overflow-hidden pt-14 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-stone-200/90 shadow-sm text-xs font-semibold text-stone-600">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>
              En homenaje a <strong>Olaf</strong> 🐶 y <strong>Lana</strong> 🐱 • Creado para
              Project Managers
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-stone-900 leading-[1.08] max-w-4xl mx-auto">
            La memoria externa que{' '}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-600 bg-clip-text text-transparent">
              no te deja en paz
            </span>{' '}
            hasta que cierras tus pendientes.
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Jira y Notion se quedan enterrados en pestañas que olvidas abrir.{' '}
            <strong>Olania</strong> vive flotando en la esquina inferior derecha de tu pantalla,
            convierte tus links de <strong>Bluedot</strong> y notas de reuniones en tareas con{' '}
            <strong>Claude IA</strong> y se turna para recordártelas.
          </p>

          {/* BOTONES DE DESCARGA PRINCIPALES */}
          <div
            id="descargar"
            className="pt-4 flex flex-wrap items-center justify-center gap-3.5"
          >
            <button
              onClick={onInstallPwa}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-violet-200 transition cursor-pointer"
            >
              <Laptop className="w-4 h-4" />
              📲 Instalar WebApp (macOS / Linux / Chrome)
            </button>

            <a
              href="/downloads/Olania-PopOS-Linux-x64.tar.gz"
              download="Olania-PopOS-Linux-x64.tar.gz"
              className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-stone-300/60 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-teal-400" />
              🐧 Descargar para Linux (Pop!_OS)
            </a>
          </div>

          <div className="pt-1 flex items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Privado en tu equipo
            </span>
            <span>•</span>
            <span>macOS (.app nativa en carpeta) & Pop!_OS Linux</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-violet-700 font-bold">
              ¡Mira abajo a la derecha, ya están vivos! <ArrowDownRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </header>

      {/* SECCIÓN SHOWCASE INTERACTIVO: CONOCE A OLAF Y LANA */}
      <section id="personajes" className="py-12 px-6">
        <div className="max-w-5xl mx-auto bg-white rounded-[2rem] p-6 sm:p-10 border border-stone-200/90 shadow-xl shadow-stone-200/40">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-extrabold uppercase tracking-widest text-violet-600">
              Dos personalidades reales en tu esquina
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              Conoce los 5 humores de Olaf y Lana
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
              Haz clic en cada estado para ver cómo reaccionan según la prioridad de tus tareas o
              cuando necesitas un descanso.
            </p>
          </div>

          {/* Selector de los 5 estados */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
            {CHARACTER_SHOWCASE.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setSelectedChar(idx)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col items-center text-center gap-2 cursor-pointer ${
                  selectedChar === idx
                    ? 'bg-violet-50/90 border-violet-500 ring-2 ring-violet-500/20 shadow-sm'
                    : 'bg-stone-50/70 border-stone-200/80 hover:bg-stone-100/80'
                }`}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white"
                />
                <span className="text-xs font-bold text-stone-800 leading-tight">
                  {item.name}
                </span>
              </button>
            ))}
          </div>

          {/* Tarjeta destacada del personaje seleccionado */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border bg-gradient-to-br transition-all ${CHARACTER_SHOWCASE[selectedChar].color}`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <img
                src={CHARACTER_SHOWCASE[selectedChar].img}
                alt={CHARACTER_SHOWCASE[selectedChar].name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover shadow-xl border-4 border-white flex-shrink-0"
              />
              <div className="space-y-3 text-center sm:text-left">
                <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-white/90 text-stone-800 shadow-sm">
                  {CHARACTER_SHOWCASE[selectedChar].badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  {CHARACTER_SHOWCASE[selectedChar].name}
                </h3>
                <p className="text-sm sm:text-base font-semibold italic opacity-95">
                  {CHARACTER_SHOWCASE[selectedChar].quote}
                </p>
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                  {CHARACTER_SHOWCASE[selectedChar].desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CÓMO FUNCIONA + PRUEBA INTERACTIVA EN VIVO */}
      <section id="como-funciona" className="py-14 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600">
              Diseñado para el caos de una PM
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              De una reunión de 45 minutos a recordatorios que sí se cumplen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              id="bluedot-ai"
              className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900">
                1. Pega un link de Bluedot o texto
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Arrastra directamente a la boca de Olaf/Lana un enlace de{' '}
                <strong>Bluedot</strong>, tus notas rápidas de una Daily o usa el botón{' '}
                <em>“Tragar lo copiado”</em> en 1 clic.<strong> Claude 3.5 Sonnet</strong> filtra la
                paja y redacta cada To-Do.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900">
                2. Se turnan sin repetir la misma
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Si tienes 3 tareas y le das a <strong>“⏳ Aún no”</strong> a la primera, Olania pasa
                automáticamente a la <strong>Tarea 2/3</strong> y luego a la <strong>3/3</strong>.
                Se van turnando según su prioridad (<strong>30m</strong>, <strong>1h</strong> o{' '}
                <strong>3h</strong>).
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-stone-900">
                3. Modo Descanso Anti-Burnout
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                ¿Demasiadas notificaciones hoy? Pulsa <strong>“🌙 Descanso”</strong>: el bocadillo
                desaparece y Olaf y Lana se acurrucan a dormir juntos en silencio hasta que tú los
                despiertes.
              </p>
            </div>
          </div>

          {/* PLAYGROUND EN VIVO EN LA PROPIA LANDING */}
          <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-stone-900 text-white rounded-[2rem] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Playground en vivo (Mira tu esquina inferior
                  derecha)
                </div>
                <h3 className="text-xl font-extrabold">
                  Pruébalo ahora mismo sin instalar nada
                </h3>
                <p className="text-xs text-violet-200 leading-relaxed">
                  Haz clic en uno de estos botones (o arrastra la tarjeta hasta el dibujito de la
                  esquina inferior derecha) para ver cómo Olaf y Lana procesan tus tareas en vivo:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() =>
                    onFeedSample(
                      '- Revisar horas estimadas\n- Enviar email a Albert\n- Hacer tarea nice'
                    )
                  }
                  className="bg-white text-stone-900 hover:bg-violet-50 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
                >
                  🍖 Alimentar con 3 tareas de prueba
                </button>

                <button
                  onClick={onTriggerDemoNudge}
                  className="bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-violet-500 transition cursor-pointer"
                >
                  🔔 Rotar turno / Simular aviso
                </button>

                <button
                  onClick={onToggleRestMode}
                  className="bg-indigo-950 hover:bg-indigo-900 text-indigo-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-700 transition cursor-pointer"
                >
                  {isResting ? '☀️ Despertar a Olaf y Lana' : '🌙 Ponerlos a dormir juntos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER COMERCIAL */}
      <footer className="max-w-5xl mx-auto px-6 pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-700">🐾 Olania</span>
          <span>— Creado con amor en homenaje a Olaf 🐶 y Lana 🐱</span>
        </div>
        <div className="flex items-center gap-4">
          <span>macOS (.app)</span>
          <span>•</span>
          <span>Linux (Pop!_OS)</span>
          <span>•</span>
          <span>Claude 3.5 Sonnet + Bluedot</span>
        </div>
      </footer>
    </div>
  );
};
