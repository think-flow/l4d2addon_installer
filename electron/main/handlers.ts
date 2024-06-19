import { ipcMain, shell, dialog, BrowserWindow } from 'electron'
import l4d2Hellper from './l4d2Helper'
import os from 'node:os'
import path from 'node:path'
import cp from 'node:child_process'

ipcMain.handle('openFolder', (_, path) => {
    return shell.openPath(path);
})

ipcMain.handle('get-addons-path', (_, arg) => {
    return l4d2Hellper.getAddonsPath();
})

ipcMain.handle('get-game-path', (_, arg) => {
    return l4d2Hellper.getGamePath();
})

ipcMain.handle('get-Downloads-path', (_, arg) => {
    return path.join(os.homedir(), 'Downloads');
})

ipcMain.handle('open-file-dialog', async (_, options) => {
    return dialog.showOpenDialog(BrowserWindow.fromId(1), options);
})

ipcMain.handle('open-recycle-bin-folder', (_, options) => {
    cp.exec('explorer shell:RecycleBinFolder', error => {
        if (error.code === 1) return;
        throw error;
    })
    return Promise.resolve();
})

ipcMain.handle('get-vpk-files', (_) => {
    return l4d2Hellper.getVpkFiles();
})

ipcMain.handle('delectVpk', (_, paths, toTrash) => {
    return l4d2Hellper.delectVpk(paths, toTrash);
})

ipcMain.handle('install-vpk-files', (_, filePaths: string[], isCoverd: boolean) => {
    return l4d2Hellper.installVpk(filePaths, isCoverd);
})