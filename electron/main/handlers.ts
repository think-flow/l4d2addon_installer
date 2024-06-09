import { ipcMain, shell } from 'electron'
import l4d2Hellper from './l4d2Helper'

ipcMain.handle('openFolder', (_, path) => {
    return shell.openPath(path);
})

ipcMain.handle('get-addons-path', (_, arg) => {
    return l4d2Hellper.getAddonsPath();
})

ipcMain.handle('get-vpk-files', (_, arg) => {
    return l4d2Hellper.getVpkFiles();
})

ipcMain.handle('delectVpk', (_, paths, toTrash) => {
    return l4d2Hellper.delectVpk(paths, toTrash);
})
