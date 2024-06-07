import { ipcMain } from 'electron'
import l4d2Hellper from './l4d2Hellper'

export const addHandlers = () => {
    ipcMain.handle('get-l4d2-hellper', (_, arg) => {
        return l4d2Hellper.getAddonsPath();
    })

    ipcMain.handle('get-vpk-files', (_, arg) => {
        return l4d2Hellper.getVpkFiles();
    })
}
