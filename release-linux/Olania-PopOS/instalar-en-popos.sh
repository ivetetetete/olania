#!/usr/bin/env bash
set -e

APP_DIR="$HOME/.local/share/olania"
DESKTOP_FILE="$HOME/.local/share/applications/olania.desktop"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🐾 Instalando Olania (Olaf & Lana) en tu Pop!_OS..."

mkdir -p "$APP_DIR"
mkdir -p "$HOME/.local/share/applications"

cp -R "$SCRIPT_DIR/dist" "$APP_DIR/"
cp -R "$SCRIPT_DIR/electron" "$APP_DIR/"
cp "$SCRIPT_DIR/package.json" "$APP_DIR/"

# Crear script lanzador inteligente para Pop!_OS
cat << 'EOF' > "$APP_DIR/launch-olania.sh"
#!/usr/bin/env bash
APP_DIR="$HOME/.local/share/olania"
cd "$APP_DIR"

# 1. Si tiene npx/electron instalado, lanza la ventana flotante transparente con Electron
if command -v npx >/dev/null 2>&1; then
  exec npx --yes electron@33 "$APP_DIR" --enable-transparent-visuals
fi

# 2. Si no tiene Node/npx, levanta un servidor ligero con python3 (incluido de serie en Pop!_OS) y abre en modo WebApp independiente
PORT=51793
python3 -m http.server $PORT --directory "$APP_DIR/dist" >/dev/null 2>&1 &
SERVER_PID=$!

for BROWSER in google-chrome brave-browser chromium-browser chromium microsoft-edge; do
  if command -v $BROWSER >/dev/null 2>&1; then
    $BROWSER --app="http://localhost:$PORT" --window-size=420,680
    kill $SERVER_PID 2>/dev/null || true
    exit 0
  fi
done

xdg-open "http://localhost:$PORT"
EOF

chmod +x "$APP_DIR/launch-olania.sh"

# Crear el acceso directo oficial en el menú de aplicaciones y Dock de Pop!_OS (GNOME / COSMIC)
cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Name=Olania
Comment=Olaf & Lana - Tu asistente personal persistente de Project Management
Exec=$APP_DIR/launch-olania.sh
Icon=$APP_DIR/dist/pets/olaf-happy.png
Terminal=false
Categories=Utility;Office;ProjectManagement;
StartupWMClass=Olania
EOF

chmod +x "$DESKTOP_FILE"
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo "✅ ¡Listo! Olania ya está instalada en tu Pop!_OS."
echo "👉 Búscala pulsando la tecla Super (Windows) y escribiendo 'Olania', o ejecútala con: $APP_DIR/launch-olania.sh"
