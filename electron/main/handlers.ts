import { ipcMain, shell } from 'electron'
import l4d2Hellper from './l4d2Helper'

export const addHandlers = () => {
    ipcMain.handle('openFolder', (_, path) => {
        return shell.openPath(path);
    })

    ipcMain.handle('get-addons-path', (_, arg) => {
        return l4d2Hellper.getAddonsPath();
    })

    ipcMain.handle('get-vpk-files', (_, arg) => {
        return l4d2Hellper.getVpkFiles();
    })


}
