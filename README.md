# 🐾 Olania (Olaf + Lana) — Tu Asistente Personal Flotante para Project Management

**Olania** es una app de escritorio flotante (Electron + React + TypeScript + Tailwind + Zustand + Claude AI) creada en homenaje a **Olaf** 🐶 y **Lana** 🐱 para acompañarte en la esquina inferior derecha de tu Mac y no dejarte olvidar ningún *To-Do* de tus reuniones o vídeos de **Bluedot**.

---

## ✨ Características Principales

1. **Dos personalidades reales en tu esquina:**
   - **🐶 Olaf:** Súper mono y cariñoso de entrada, pero si le das a *"Aún no"* varias veces saca su carácter y se enfada.
   - **🐱 Lana:** Directa, cañera y con carácter. Sale especialmente cuando hay tareas de **Prioridad Alta** o llevas posponiendo algo demasiado tiempo.
2. **Reloj de Recordatorios por Prioridad:**
   - 🔥 **Alta:** Te insiste cada **30 minutos**.
   - ⚡ **Media:** Te recuerda cada **1 hora**.
   - 🌱 **Baja:** Te recuerda cada **3 horas**.
   - Puedes cambiar la prioridad de cualquier tarea en cualquier momento desde el propio bocadillo.
3. **3 Formas de Alimentar a Olania:**
   - **🍖 Drag & Drop:** Arrastra un texto o un link de **Bluedot** directamente encima de la carita de Olaf o Lana.
   - **📋 Tragar copiado:** Copia cualquier nota o link (`Cmd + C`) y pulsa el botón *"Tragar copiado"*.
   - **⌨️ Cajón rápido (`Cmd + Shift + O`):** Abre el panel desde cualquier app de tu Mac, pega el texto o link de Bluedot y pulsa *Alimentar*.

---

## 🚀 Cómo arrancarla

### Opción A: Como App Flotante en la esquina de tu Mac (Electron)
```bash
npm run electron:dev
```

### Opción B: En tu navegador (Modo interactivo con guía de prueba)
```bash
npm run dev
```
Y abre [http://localhost:5173](http://localhost:5173).

---

## 🔑 Configurar Claude API y Bluedot
1. Puedes pegar tu `ANTHROPIC_API_KEY` directamente dentro de la app pulsando el icono de **⚙️ Ajustes** en el panel de Olania (se guarda en local), o crear un archivo `.env` con:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
2. *(Incluso sin API Key configurada, Olania incluye un motor heurístico local para que puedas usarla desde el primer segundo).*
3. Si tus vídeos de **Bluedot** son privados de empresa, pulsa **"🎥 Conectar Bluedot"** dentro de **⚙️ Ajustes** (en modo Electron) para iniciar sesión una sola vez.
