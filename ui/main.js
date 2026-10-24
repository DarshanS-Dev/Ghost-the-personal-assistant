const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow = null;
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const [x, y] = mainWindow.getPosition();
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify({ x, y }));
  } catch (e) {}
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const width = 580;
  const height = 64;

  const saved = loadWindowState();
  let x = saved && typeof saved.x === 'number' ? saved.x : Math.round((screenWidth - width) / 2);
  let y = saved && typeof saved.y === 'number' ? saved.y : Math.round(screenHeight / 4);

  // Guard against off-screen positions if screen resolution changed
  if (x < 0 || x > screenWidth - 100) x = Math.round((screenWidth - width) / 2);
  if (y < 0 || y > screenHeight - 60) y = Math.round(screenHeight / 4);

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    movable: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Save position when dragged or moved
  mainWindow.on('moved', saveWindowState);
  mainWindow.on('close', saveWindowState);
}

// Adjust window height when result appears / collapses
ipcMain.handle('ghost:set-height', (event, newHeight) => {
  if (mainWindow) {
    const [w] = mainWindow.getSize();
    mainWindow.setSize(w, newHeight);
  }
});

// Execute the python backend
ipcMain.handle('ghost:run-prompt', async (event, prompt) => {
  return new Promise((resolve) => {
    const rootDir = path.join(__dirname, '..');
    const venvPython = path.join(rootDir, '.venv', 'bin', 'python');
    const pythonExec = fs.existsSync(venvPython) ? venvPython : 'python3';
    const backendScript = path.join(rootDir, 'backend', 'main.py');

    const pyProcess = spawn(pythonExec, [backendScript, prompt], {
      cwd: rootDir,
    });

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('close', () => {
      const lines = stdout.split('\n').filter((line) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('Direct use of automatic function calling');
      });
      const result = lines.join('\n').trim();
      resolve(result || stderr.trim() || 'Done.');
    });

    pyProcess.on('error', (err) => {
      resolve(`Error: ${err.message}`);
    });
  });
});

ipcMain.handle('ghost:close-window', () => {
  if (mainWindow) {
    saveWindowState();
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();

  // Optional global shortcut: Alt+Space toggles visibility
  try {
    globalShortcut.register('Alt+Space', () => {
      if (!mainWindow) {
        createWindow();
      } else if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
