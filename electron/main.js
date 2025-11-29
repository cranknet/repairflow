const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let nextServerProcess;
// Use app.isPackaged to reliably detect if we're in production
const isDev = !app.isPackaged;
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
        show: false, // Don't show until ready
    });

    // Load the Next.js app
    const url = `http://localhost:${port}`;

    console.log(`Loading URL: ${url} (isDev: ${isDev})`);

    mainWindow.loadURL(url);

    // Show window when ready to avoid blank screen
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development mode only
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Handle load errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });

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
            console.log('Production mode: starting Next.js server...');

            // With ASAR enabled, point to app.asar
            // Note: Node.js cannot execute files inside ASAR directly
            // This will likely fail unless server.js is unpacked
            const serverPath = path.join(process.resourcesPath, 'app.asar', 'server.js');
            const appPath = path.join(process.resourcesPath, 'app.asar');

            console.log('Server path:', serverPath);
            console.log('App path:', appPath);

            nextServerProcess = spawn('node', [serverPath], {
                cwd: appPath,
                env: {
                    ...process.env,
                    PORT: port,
                    NODE_ENV: 'production'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let serverReady = false;

            nextServerProcess.stdout.on('data', (data) => {
                const message = data.toString();
                console.log('Server:', message);
                if (message.includes('Ready') || message.includes('started')) {
                    serverReady = true;
                    resolve();
                }
            });

            nextServerProcess.stderr.on('data', (data) => {
                console.error('Server error:', data.toString());
            });

            nextServerProcess.on('error', (error) => {
                console.error('Failed to start Next.js server:', error);
                reject(error);
            });

            nextServerProcess.on('exit', (code) => {
                console.log('Server process exited with code:', code);
            });

            // Fallback timeout if we don't detect "Ready" message
            setTimeout(() => {
                if (!serverReady) {
                    console.log('Server should be ready (timeout reached)');
                    resolve();
                }
            }, 5000);
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
