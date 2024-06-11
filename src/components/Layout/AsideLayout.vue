<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useLoggerStore } from '../../stores/logger'
import { useVpkFileStore } from '../../stores/vpkFile'

type VpkFileInfo = {
    file: string,
    fileWithoutEx: string,
    filePath: string,
    creationTime: Date
}

const isShow = ref(false)
const fileStore = useVpkFileStore()
const optionsComponent = reactive({
    zIndex: 3,
    // minWidth: 230,
    x: 500,
    y: 200
})
let selectedItem: any = null;

onMounted(async () => {
    await fileStore.updateList();
})

function onContextmenu(item: any, e: MouseEvent) {
    selectedItem = item;
    isShow.value = true;
    optionsComponent.x = e.x;
    optionsComponent.y = e.y;
}

async function onDeleteVpk() {
    let result = await window.ipcRenderer.delectVpk([selectedItem.filePath], true)
    if (result) {
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
        //删除成功后刷新列表
        await fileStore.updateList();

    } else {
        ElMessage({
            message: '删除失败',
            type: 'warning',
        })
    }
}
</script>

<template>
    <el-scrollbar wrap-class="container">
        <div>
            <!-- 展示vpk文件 -->
            <ul>
                <li v-for="file in fileStore.fileList" @contextmenu.prev="onContextmenu(file, $event)">
                    {{ file.file }}
                </li>
            </ul>
        </div>
    </el-scrollbar>

    <context-menu v-model:show="isShow" :options="optionsComponent">
        <context-menu-item label="删除" @click="onDeleteVpk" />
    </context-menu>
</template>

<style>
.container {
    height: 100vh;
    background-color: #f0f0f0;
    box-sizing: border-box;
    border-right: 1px solid #ccc;
}

ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

li {
    padding: 10px;
    border-top: 1px solid #ccc;
}

li:hover {
    background-color: #e0e0e0;
    cursor: pointer;
}
</style>