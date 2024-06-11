import { ref } from 'vue'
import { defineStore } from 'pinia'

type Message = {
    time: Date,
    msg: string,
    type: string
}

export const useLoggerStore = defineStore('logger', () => {
    const logs = ref<Message[]>([])

    function logMsg(msg: any) {
        logs.value.push({ time: new Date(), msg: msg, type: 'message' })
    }

    function logError(msg: any) {
        logs.value.push({ time: new Date(), msg: msg, type: 'error' })
    }
    return { logs, logMsg, logError }
})