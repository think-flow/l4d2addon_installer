
import { BrowserWindow } from 'electron'

// 将日志信息发送到main窗口
export const log = (message: string) => {
    BrowserWindow.fromId(1).webContents.send('main-process-log-message', message)
}

// 将日志信息发送到main窗口
export const logErr = (message: string) => {
    BrowserWindow.fromId(1).webContents.send('main-process-log-error', message)
}
