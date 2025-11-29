const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Get application paths
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getDatabasePath: () => ipcRenderer.invoke('get-database-path'),

    // Check if running in Electron
    isElectron: true,

    // Platform information
    platform: process.platform,
});
