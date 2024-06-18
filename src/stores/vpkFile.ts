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
            //清空所有元素
            fileList.value.splice(0);
            //再把元素添加进去
            datas.forEach((data: VpkFileInfo) => {
                fileList.value.push(data)
            });
        } catch (err) {
            logError(err)
        }
    }

    return { fileList, updateList }
})