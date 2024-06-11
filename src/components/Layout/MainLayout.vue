<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElSwitch } from 'element-plus'
import { useLoggerStore } from '../../stores/logger'
import { useVpkFileStore } from '../../stores/vpkFile';

const addonPathIsLoading = ref(false);
const gamePathIsLoading = ref(false);
const disabled = ref(false);
const isCoverd = ref(true);
const extensions = ['vpk', 'zip', 'rar'];
const logger = useLoggerStore()
const fileStore = useVpkFileStore()

async function openAddonsFloder() {
    addonPathIsLoading.value = true;
    try {
        let addonsPath = await window.ipcRenderer.invoke('get-addons-path');
        await window.ipcRenderer.openFolder(addonsPath);
        addonPathIsLoading.value = false;
    } catch (err) {
        addonPathIsLoading.value = false;
        logger.logError(err)
    }
}

async function openGameFolder() {
    gamePathIsLoading.value = true;
    try {
        let gamePath = await window.ipcRenderer.invoke('get-game-path');
        await window.ipcRenderer.openFolder(gamePath);
        gamePathIsLoading.value = false;
    } catch (err) {
        gamePathIsLoading.value = false;
        logger.logError(err)
    }
}

//安装vpk文件
async function installVpk(files: string[]) {
    disabled.value = true;
    const result = await window.ipcRenderer.invoke('install-vpk-files', files, isCoverd.value);
    disabled.value = false;
    if (result) {
        ElMessage.success('安装成功');
    } else {
        ElMessage.error(`安装失败，请查看日志`)
    }
    //刷新列表
    await fileStore.updateList()
}

async function handleClick() {
    //选择文件安装
    const filePaths:string[] = await window.ipcRenderer.showOpenDialog({
        title: '选择',
        filters: [{
            name: 'mod文件',
            extensions: extensions
        }],
        properties: ['openFile', 'multiSelections', 'dontAddToRecent']
    });
    if (filePaths == null) return;
    await installVpk(filePaths);
}

async function handleDrop(event: any) {
    //拖动文件安装
    const arr = [...event.dataTransfer?.files];
    const filePaths: string[] = arr.map(file => file.path);
    //判断后缀名是否正确
    for (const path of filePaths) {
        const extension = path.match(/\.([0-9a-z]+)(?:[\?#]|$)/i)?.[1] ?? '';
        if (!extensions.includes(extension)) {
            ElMessage.error(`只支持 ${extensions.reduce((pv, cv) => pv + ' ' + cv)} 文件`)
            return;
        }
    }
    await installVpk(filePaths);
}

function preventDeault(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
}
</script>

<template>
    <div class="content">
        <div class="top">
            <el-button type="primary" @click="openAddonsFloder" plain
                :loading="addonPathIsLoading">addons文件夹</el-button>
            <el-button type="primary" @click="openGameFolder" plain :loading="gamePathIsLoading">l4d2文件夹</el-button>
        </div>
        <div class="bottom" v-loading="disabled" element-loading-text="正在安装...">
            <div class="switch">
                <el-switch inline-prompt v-model="isCoverd" active-text="替换文件" inactive-text="不替换文件" size="large"
                    style="--el-switch-on-color: #409eff99; --el-switch-off-color: #409eff99" />
            </div>
            <!-- 文件安装区域 -->
            <div class="installer" @click="handleClick" @contextmenu="handleClick" @dragenter="preventDeault"
                @dragover="preventDeault" @dragleave="preventDeault" @drop="handleDrop">
                此区域安装vpk
            </div>
        </div>
    </div>
</template>

<style>
.content {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
}

.content .top {
    flex: 1;
    margin: 2px;
}

.content .bottom {
    height: 50%;
    margin: 2px;
    position: relative;
}

.installer {
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    height: 100%;
    border: 1px dashed #979292;
    background-color: #f9f9f9;
    user-select: none;
    font-size: 0.9em;
    font-family: serif, sans-serif;
    color: grey;
}

.installer:hover {
    cursor: pointer;
    /* background-color: #e9e9e9; */
}

.switch {
    position: absolute;
    top: 5px;
    right: 10px;
}
</style>