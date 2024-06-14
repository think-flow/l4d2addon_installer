<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElRow, ElCol } from 'element-plus'
import { useVpkFileStore } from '../../stores/vpkFile'

//完成拖动多选，和shift多选功能

const showContextmenu = ref(false)
const showProperty = ref(false)
const mousePosition = reactive({ x: 0, y: 0 })
const filePropertyStyle = computed((): any => ({
    top: mousePosition.y + 'px',
    left: mousePosition.x + 'px',
    visibility: showProperty.value ? 'visible' : 'hidden'
}))

const fileStore = useVpkFileStore()
const optionsComponent = reactive({
    zIndex: 3,
    x: 500,
    y: 200
})
let selectedItem: any = null;
let showItem: any = null;

onMounted(async () => {
    await fileStore.updateList();
})

function onContextmenu(item: any, e: MouseEvent) {
    selectedItem = item;
    showContextmenu.value = true;
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

function onMouseover(item: any, e: MouseEvent) {
    const hoverLi: any = e.target;
    showItem = item;
    let popTimer = window.setTimeout(() => {
        showProperty.value = true;
    }, 1000);

    //添加mouseout事件来在鼠标移出时隐藏弹出框并清除定时器  
    hoverLi.addEventListener('mouseout', () => {
        window.clearTimeout(popTimer); // 清除定时器
        showProperty.value = false;
    }, { once: true }); // 只执行一次，之后自动移除事件监听器  
}

function onMousemove(e: MouseEvent) {
    //更新鼠标位置  
    if (showProperty.value) return;
    let element = <HTMLLIElement>e.target;
    let rect = element.getBoundingClientRect();
    let offsetHeight = (<HTMLDivElement>document.querySelector('.fileProperty')).offsetHeight;

    mousePosition.x = e.clientX;
    if (rect.bottom + offsetHeight > window.innerHeight) {
        //当rect.bottom + 属性窗口高度 超出窗口高度时，则将其显示在li元素顶部
        mousePosition.y = rect.top - offsetHeight; //在li元素顶部显示
    } else {
        mousePosition.y = rect.bottom; //在li元素底部显示
    }
}

function formatDate(date: Date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份从0开始，需要加1
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // 使用padStart保证双位数格式
    const formattedDate = `${year}/${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return formattedDate;
}

</script>

<template>
    <div class="container">
        <el-scrollbar wrap-class="list">
            <!-- 展示vpk文件 -->
            <div>
                <ul>
                    <li v-for="file in fileStore.fileList" @contextmenu.prev="onContextmenu(file, $event)"
                        @mouseover="onMouseover(file, $event)" @mousemove="onMousemove">
                        {{ file.file }}
                    </li>
                </ul>
            </div>
        </el-scrollbar>
        <div class="fileProperty" :style="filePropertyStyle">
            <div>大小: {{ showItem?.size }}</div>
            <div>创建日期: {{ formatDate(showItem?.creationTime) }}</div>
        </div>
        <div class="statistics">
            <el-row>
                <el-col :span="8">
                    {{ fileStore.fileList.length }}个文件
                </el-col>
                <el-col :span="16">
                    已选择??个文件
                </el-col>
            </el-row>
        </div>
    </div>

    <context-menu v-model:show="showContextmenu" :options="optionsComponent">
        <context-menu-item label="删除" @click="onDeleteVpk" />
    </context-menu>
</template>

<style>
.container {
    height: 100vh;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.list {
    background-color: #f0f0f0;
    box-sizing: border-box;
    flex: 1;
    word-break: break-all;
}

.statistics {
    padding-left: 10px;
    background-color: #f9f9f9;
    font-size: 0.8em;
    font-family: serif, sans-serif;
    border-top: 1px solid #ccc;
    user-select: none;
}

.fileProperty {
    position: absolute;
    background-color: #eeeded;
    z-index: 1;
    font-size: 0.8em;
    font-family: serif, sans-serif;
    padding: 5px;
    box-shadow: var(--el-box-shadow-dark);
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