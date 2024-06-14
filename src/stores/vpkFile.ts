import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useLoggerStore } from './logger'

type VpkFileInfo = {
    file: string,
    fileWithoutEx: string,
    filePath: string,
    creationTime: Date,
    size: string
}

export const useVpkFileStore = defineStore('vpk-file-list', () => {
    const fileList = ref<VpkFileInfo[]>([])
    const { logError } = useLoggerStore()

    async function updateList() {
        try {
            const datas = await window.ipcRenderer.invoke('get-vpk-files');
            fileList.value = datas;
        } catch (err) {
            logError(err)
        }
    }

    return { fileList, updateList }
})