const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const width = 640;
  const height = 480;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: Math.round((screenWidth - width) / 2),
    y: Math.round(screenHeight / 4),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
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
}

// IPC handler to execute the python backend
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

    pyProcess.on('close', (code) => {
      // Filter out GenAI SDK warnings from stdout
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
  } catch (err) {
    console.error('Could not register global shortcut:', err);
  }

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
