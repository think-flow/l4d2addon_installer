<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useLoggerStore } from '../../stores/logger'

type VpkFileInfo = {
    file: string,
    fileWithoutEx: string,
    filePath: string,
    creationTime: Date
}

const files = ref<VpkFileInfo[]>([])
const isShow = ref(false)
const logger = useLoggerStore()
const optionsComponent = reactive({
    zIndex: 3,
    // minWidth: 230,
    x: 500,
    y: 200
})
let selectedItem: any = null;

onMounted(async () => {
    await updateList();
})

async function updateList() {
    try {
        const datas = await ipcRenderer.invoke('get-vpk-files');
        files.value = datas;
    } catch (err) {
        logger.logError(err)
    }
}

function onContextmenu(item: any, e: MouseEvent) {
    selectedItem = item;
    isShow.value = true;
    optionsComponent.x = e.x;
    optionsComponent.y = e.y;
}

async function onDeleteVpk() {
    let result = await ipcRenderer.delectVpk([selectedItem.filePath], true)
    if (result) {
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
        //删除成功后刷新列表
        await updateList();

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
                <li v-for="item in files" @contextmenu.prev="onContextmenu(item, $event)">
                    {{ item.file }}
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