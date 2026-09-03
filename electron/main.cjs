const { app, BrowserWindow, shell, session, dialog } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

const WEB_APP_URL = 'https://joelengelman.github.io/Pulse/';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Pulse',
    autoHideMenuBar: true,
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(WEB_APP_URL, {
    userAgent: `${win.webContents.getUserAgent()} PulseDesktop/1.0.1`,
  });
}

async function checkForUpdates(showNoUpdate = false) {
  if (!app.isPackaged) return;

  try {
    const result = await autoUpdater.checkForUpdates();

    if (showNoUpdate && !result?.updateInfo) {
      await dialog.showMessageBox({
        type: 'info',
        title: 'Pulse is up to date',
        message: `You're using Pulse ${app.getVersion()}.`,
      });
    }
  } catch (error) {
    console.error('Pulse updater error:', error);
    if (showNoUpdate) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Could not check for updates',
        message: 'Pulse could not check GitHub for an update right now. Please try again later.',
      });
    }
  }
}

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', async (info) => {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Pulse update available',
    message: `Pulse ${info.version} is available. You're currently using ${app.getVersion()}.`,
    detail: 'Download the update now? Pulse will install it when you restart the app.',
    buttons: ['Download update', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Pulse update download failed:', error);
      await dialog.showMessageBox({
        type: 'error',
        title: 'Update download failed',
        message: 'Pulse could not download the update. Please try again later.',
      });
    }
  }
});

autoUpdater.on('update-downloaded', async (info) => {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Pulse update ready',
    message: `Pulse ${info.version} has been downloaded.`,
    detail: 'Restart Pulse now to install the update.',
    buttons: ['Restart & update', 'Later'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    autoUpdater.quitAndInstall();
  }
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(true));
  createWindow();

  // Check shortly after startup, then periodically while Pulse is open.
  setTimeout(() => checkForUpdates(false), 5000);
  setInterval(() => checkForUpdates(false), 30 * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
