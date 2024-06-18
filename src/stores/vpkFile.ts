import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useLoggerStore } from './logger'

type VpkFileInfo = {
    file: string,
    fileWithoutEx: string,
    filePath: string,
    creationTime: Date,
    size: string,
    selected: boolean
}

let timer = 0;

export const useVpkFileStore = defineStore('vpk-file-list', () => {
    const fileList = ref<VpkFileInfo[]>([])
    const { logError } = useLoggerStore()

    //接收addons文件夹变化消息，并更新数据
    window.ipcRenderer.on('main-process-addons-folder-changed', (_event: any, msg: any) => {
        if (timer === 0) {
            timer = window.setTimeout(() => {
                timer = 0;
                updateList();
            }, 700);
        }
    });

    async function updateList() {
        try {
            const datas = await window.ipcRenderer.invoke('get-vpk-files');
            //清空所有元素
            fileList.value.splice(0);
            //再把元素添加进去
            datas.forEach((data: VpkFileInfo) => {
                data.selected = false;
                fileList.value.push(data)
            });
        } catch (err) {
            logError(err)
        }
    }

    return { fileList, updateList }
})