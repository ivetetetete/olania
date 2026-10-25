const { app, BrowserWindow, screen, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');

// Soporte para transparencia real en Linux (Pop!_OS / Ubuntu / GNOME / COSMIC)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const winWidth = 430;
  const winHeight = 680;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: width - winWidth - 16,
    y: height - winHeight - 16,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: false,
    icon: path.join(__dirname, '..', 'dist', 'pets', 'olaf-happy.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Asegurar que flote encima de aplicaciones en macOS
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

  if (process.env.OLANIA_DEV === '1') {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(`${devUrl}?electron=1`).catch(() => {
      mainWindow.loadFile(distIndex);
    });
  } else {
    mainWindow.loadFile(distIndex);
  }

  // Por defecto dejar pasar los clics en las zonas transparentes hacia las apps de debajo en macOS
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
}

app.whenReady().then(async () => {
  // En Linux (Pop!_OS) conviene esperar ~300ms a que el compositor X11/Wayland inicialice el canal alfa
  if (process.platform === 'linux') {
    await new Promise((r) => setTimeout(r, 300));
  }
  createWindow();

  // Atajo global Cmd+Shift+O para invocar o plegar a Olania desde cualquier app
  globalShortcut.register('CommandOrControl+Shift+O', () => {
    if (!mainWindow) return;
    mainWindow.webContents.send('olania:toggle-panel');
    mainWindow.show();
    mainWindow.focus();
  });

  ipcMain.on('olania:set-ignore-mouse', (_event, ignore) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (ignore) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      mainWindow.setIgnoreMouseEvents(false);
    }
  });

  ipcMain.handle('olania:open-external', async (_event, url) => {
    if (url && typeof url === 'string' && url.startsWith('http')) {
      await shell.openExternal(url);
    }
  });

  ipcMain.handle('olania:login-bluedot', async () => {
    const loginWin = new BrowserWindow({
      width: 960,
      height: 720,
      title: 'Conectar cuenta de Bluedot con Olania',
      webPreferences: {
        partition: 'persist:bluedot',
      },
    });
    await loginWin.loadURL('https://app.bluedothq.com');
    return { ok: true };
  });

  ipcMain.handle('olania:scrape-bluedot', async (_event, url) => {
    if (!url || !url.startsWith('http')) return { text: '' };
    const scraperWin = new BrowserWindow({
      width: 1000,
      height: 800,
      show: false,
      webPreferences: {
        partition: 'persist:bluedot',
      },
    });

    try {
      await scraperWin.loadURL(url);
      await new Promise((r) => setTimeout(r, 3500));
      const extractedText = await scraperWin.webContents.executeJavaScript(`
        (function() {
          const title = document.title || '';
          const bodyText = document.body ? document.body.innerText : '';
          return title + "\\n\\n" + bodyText.slice(0, 8000);
        })();
      `);
      scraperWin.destroy();
      return { text: extractedText || '' };
    } catch (err) {
      if (!scraperWin.isDestroyed()) scraperWin.destroy();
      return { text: '', error: err.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
