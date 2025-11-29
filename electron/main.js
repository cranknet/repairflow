const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let nextServerProcess;
const isDev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, '../public/favicon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        backgroundColor: '#ffffff',
    });

    // Load the Next.js app
    const url = isDev
        ? `http://localhost:${port}`
        : `http://localhost:${port}`;

    mainWindow.loadURL(url);

    // Open DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startNextServer() {
    return new Promise((resolve, reject) => {
        if (isDev) {
            // In development, Next.js should already be running
            console.log('Development mode: assuming Next.js is running on port', port);
            resolve();
        } else {
            // In production, start the Next.js server
            const nextServerPath = path.join(__dirname, '../server.js');

            nextServerProcess = spawn('node', [nextServerPath], {
                cwd: path.join(__dirname, '..'),
                env: { ...process.env, PORT: port },
                stdio: 'inherit'
            });

            nextServerProcess.on('error', (error) => {
                console.error('Failed to start Next.js server:', error);
                reject(error);
            });

            // Wait a bit for the server to start
            setTimeout(() => {
                console.log('Next.js server started on port', port);
                resolve();
            }, 3000);
        }
    });
}

function stopNextServer() {
    if (nextServerProcess) {
        console.log('Stopping Next.js server...');
        nextServerProcess.kill();
        nextServerProcess = null;
    }
}

// IPC handlers
ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
});

ipcMain.handle('get-database-path', () => {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'prisma', 'repairflow.db');
});

// App lifecycle
app.on('ready', async () => {
    try {
        await startNextServer();
        createWindow();
    } catch (error) {
        console.error('Failed to start application:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    stopNextServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Cleanup on app quit
app.on('before-quit', () => {
    stopNextServer();
});

app.on('will-quit', () => {
    stopNextServer();
});

// Handle app quit
process.on('exit', () => {
    stopNextServer();
});
