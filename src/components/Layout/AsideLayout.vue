<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'


const files = reactive([])
const isShow = ref(false)
const optionsComponent = reactive({
    zIndex: 3,
    // minWidth: 230,
    x: 500,
    y: 200
})
let selectedItem = null;

onMounted(async () => {
    const datas = await ipcRenderer.invoke('get-vpk-files');

    console.log(datas);

    datas.forEach(data => {
        files.push(data)
    });
})

function onContextmenu(item: any, e: MouseEvent) {
    selectedItem = item;
    isShow.value = true;
    optionsComponent.x = e.x;
    optionsComponent.y = e.y;
}

function onDeleteVpk() {
    console.log(selectedItem)
    //拿到需要删除的项
    ElMessage({
        message: '删除成功',
        type: 'success',
    })
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
    /* overflow-y: auto; */
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