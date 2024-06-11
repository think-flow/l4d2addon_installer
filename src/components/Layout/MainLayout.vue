<script setup lang="ts">
import { ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus'

const addonPathIsLoading = ref(false);
const gamePathIsLoading = ref(false);
const extensions = ['vpk', 'zip', 'rar'];

async function openAddonsFloder() {
    addonPathIsLoading.value = true;
    try {
        let addonsPath = await ipcRenderer.invoke('get-addons-path');
        await ipcRenderer.openFolder(addonsPath);
        addonPathIsLoading.value = false;
    } catch (error) {
        addonPathIsLoading.value = false;
        ElMessageBox.alert(error)
    }
}

async function openGameFolder() {
    gamePathIsLoading.value = true;
    try {
        let gamePath = await ipcRenderer.invoke('get-game-path');
        await ipcRenderer.openFolder(gamePath);
        gamePathIsLoading.value = false;
    } catch (error) {
        gamePathIsLoading.value = false;
        ElMessageBox.alert(error)
    }
}

//安装vpk文件
async function installVpk(files: string[]) {

}

async function handleClick() {
    //选择文件安装
    const filePaths: string[] = await ipcRenderer.invoke('open-file-dialog', {
        title: '选择',
        filters: [{
            name: 'mod文件',
            extensions: extensions
        }],
        properties: ['openFile', 'multiSelections', 'dontAddToRecent']
    });
    await installVpk(filePaths);
}

async function handleDrop(event: DragEvent) {
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
        <div class="bottom">
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
    color: grey;
    font-family: serif, sans-serif;
}

.installer:hover {
    cursor: pointer;
    /* background-color: #e9e9e9; */
}
</style>