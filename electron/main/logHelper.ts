
import { win } from './index'

// 将日志信息发送到main窗口
export const log = (message: string) => {
    win?.webContents.send('main-process-log-message', message)
}

// 将日志信息发送到main窗口
export const logErr = (message: string) => {
    win?.webContents.send('main-process-log-error', message)
}
