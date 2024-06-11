import { ipcMain, shell, dialog } from 'electron'
import l4d2Hellper from './l4d2Helper'
import { win } from './index'

ipcMain.handle('openFolder', (_, path) => {
    return shell.openPath(path);
})

ipcMain.handle('get-addons-path', (_, arg) => {
    return l4d2Hellper.getAddonsPath();
})
ipcMain.handle('get-game-path', (_, arg) => {
    return l4d2Hellper.getGamePath();
})

ipcMain.handle('open-file-dialog', async (_, options) => {
    let result = await dialog.showOpenDialog(win, options)
    return result.filePaths;
})

ipcMain.handle('get-vpk-files', (_, arg) => {
    return l4d2Hellper.getVpkFiles();
})

ipcMain.handle('delectVpk', (_, paths, toTrash) => {
    return l4d2Hellper.delectVpk(paths, toTrash);
})

ipcMain.handle('install-vpk-files', (_, filePaths: string[], isCoverd: boolean) => {
    return l4d2Hellper.installVpk(filePaths, isCoverd);
})