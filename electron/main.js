const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let nextServerProcess;
// Use app.isPackaged to reliably detect if we're in production
const isDev = !app.isPackaged;
const port = process.env.PORT || 3000;

// Logging setup
const logFile = path.join(app.getPath('userData'), 'app.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (error) {
        // Fallback to console if file write fails
        console.log(message);
    }
}

// Clear log file on startup
try {
    fs.writeFileSync(logFile, '');
} catch (e) { }

logToFile(`App starting... isDev: ${isDev}`);
logToFile(`UserData path: ${app.getPath('userData')}`);

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

    logToFile(`Loading URL: ${url} (isDev: ${isDev})`);

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
        logToFile(`Failed to load: ${errorCode} ${errorDescription}`);
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
            logToFile('Production mode: starting Next.js server...');

            // With ASAR enabled, point to app.asar
            // Note: Node.js cannot execute files inside ASAR directly
            // This will likely fail unless server.js is unpacked
            const serverPath = path.join(process.resourcesPath, 'app', 'server.js');
            const appPath = path.join(process.resourcesPath, 'app');

            logToFile(`Server path: ${serverPath}`);
            logToFile(`App path: ${appPath}`);

            if (!fs.existsSync(serverPath)) {
                logToFile(`ERROR: Server file not found at ${serverPath}`);
                // Try to list contents of app path
                try {
                    const files = fs.readdirSync(appPath);
                    logToFile(`Files in app path: ${files.join(', ')}`);
                } catch (e) {
                    logToFile(`Error listing app path: ${e.message}`);
                }
            }

            // Debug Prisma files
            const prismaPath = path.join(appPath, 'node_modules', '.prisma');
            if (fs.existsSync(prismaPath)) {
                logToFile(`Prisma path exists: ${prismaPath}`);
                try {
                    const prismaFiles = fs.readdirSync(path.join(prismaPath, 'client'));
                    logToFile(`Prisma client files: ${prismaFiles.join(', ')}`);
                } catch (e) {
                    logToFile(`Error listing prisma client files: ${e.message}`);
                }
            } else {
                logToFile(`ERROR: Prisma path NOT found at ${prismaPath}`);
            }

            nextServerProcess = spawn('node', [serverPath], {
                cwd: appPath,
                env: {
                    ...process.env,
                    PORT: port,
                    NODE_ENV: 'production',
                    HOSTNAME: 'localhost',
                    // Force Prisma to use the binary engine which is more reliable in Electron
                    PRISMA_CLIENT_ENGINE_TYPE: 'binary',
                    // Explicitly set the schema path if needed, though usually auto-detected
                    // PRISMA_SCHEMA_PATH: path.join(appPath, 'prisma', 'schema.prisma'),
                    DATABASE_URL: `file:${path.join(app.getPath('userData'), 'repairflow.db')}`
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let serverReady = false;

            nextServerProcess.stdout.on('data', (data) => {
                const message = data.toString();
                logToFile(`Server: ${message}`);
                if (message.includes('Ready') || message.includes('started')) {
                    serverReady = true;
                    resolve();
                }
            });

            nextServerProcess.stderr.on('data', (data) => {
                logToFile(`Server error: ${data.toString()}`);
            });

            nextServerProcess.on('error', (error) => {
                logToFile(`Failed to start Next.js server: ${error.message}`);
                reject(error);
            });

            nextServerProcess.on('exit', (code) => {
                logToFile(`Server process exited with code: ${code}`);
            });

            // Fallback timeout if we don't detect "Ready" message
            setTimeout(() => {
                if (!serverReady) {
                    logToFile('Server should be ready (timeout reached)');
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
        logToFile(`Failed to start application: ${error.message}`);
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
