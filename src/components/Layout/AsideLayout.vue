<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElRow, ElCol } from 'element-plus'
import { useLoggerStore } from '../../stores/logger'
import { useVpkFileStore } from '../../stores/vpkFile'

type VpkFileInfo = typeof fileStore.fileList[number];

const logger = useLoggerStore();
const showContextmenu = ref(false)
const showProperty = ref(false)
const mousePosition = { x: 0, y: 0 } //注意这里不是响应式的。
//使用showProperty对象，来触发computed的更新
const filePropertyStyle = computed((): any => ({
    top: mousePosition.y + 'px',
    left: mousePosition.x + 'px',
    visibility: showProperty.value ? 'visible' : 'hidden'
}))

const fileStore = useVpkFileStore();

const optionsComponent = reactive({
    zIndex: 3,
    x: 500,
    y: 200
})

let showItem: VpkFileInfo | null = null;

onMounted(async () => {
    await fileStore.updateList();
    addDivFocusoutEventListener();
})

function onContextmenu(e: MouseEvent) {
    showContextmenu.value = true;
    optionsComponent.x = e.x;
    optionsComponent.y = e.y;
}

async function onDeleteVpk() {
    let deletedFilePaths = selectedItems.value.map(index => {
        const fileInfo = fileStore.fileList[index];
        if (!fileInfo) return '';
        return fileInfo.filePath;
    });
    deletedFilePaths = deletedFilePaths.filter(item => item !== '');
    if (deletedFilePaths.length < 1) return;

    const result = await window.ipcRenderer.delectVpk(deletedFilePaths, true)
    if (result) {
        ElMessage({
            message: '删除成功',
            type: 'success',
        })
        //删除成功后刷新列表
        //不需要手动刷新了，由main-process-addons-folder-changed处理
        // await fileStore.updateList();
    } else {
        ElMessage({
            message: '删除失败',
            type: 'warning',
        })
    }
}

async function onCopyFileName() {
    const items = selectedItems.value;
    if (items.length < 1) return;

    let copyText = '';
    if (items.length === 1) {
        copyText = fileStore.fileList[items[0]]?.file ?? '';
    } else {
        copyText = items.map(index => {
            const fileInfo = fileStore.fileList[index];
            if (!fileInfo) return '';
            return `"${fileInfo.file}"`
        }).filter(item => item != '').join(' ');
    }

    try {
        if (copyText === '') return;
        await navigator.clipboard.writeText(copyText);
        logger.logMsg('文件名已写入剪贴板');
    } catch (err) {
        logger.logError("文件名复制失败： " + err)
    }
}

function onMouseover(item: VpkFileInfo, e: MouseEvent) {
    const hoverLi: any = e.target;
    showItem = item;
    const popTimer = window.setTimeout(() => {
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
    const liElement = <HTMLLIElement>e.target;
    // const rect = element.getBoundingClientRect();
    //使用如下计算，替代getBoundingClientRect方法
    const scrollTop = (<HTMLDivElement>document.querySelector('.list')).scrollTop;
    const liTop = liElement.offsetTop - scrollTop;
    const liBottom = liTop + liElement.offsetHeight;
    const offsetHeight = (<HTMLDivElement>document.querySelector('.fileProperty')).offsetHeight;

    mousePosition.x = e.clientX + 15;
    if (liBottom + offsetHeight > window.innerHeight) {
        //当li.bottom + 属性窗口高度 超出窗口高度时，则将其显示在li元素顶部
        mousePosition.y = liTop - offsetHeight; //在li元素顶部显示
    } else {
        mousePosition.y = liBottom; //在li元素底部显示
    }
}

function formatDate(date: Date | null | undefined) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月份从0开始，需要加1
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // 使用padStart保证双位数格式
    return `${year}/${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/** 处理文件列表选择 ------开始----*/
const selectedItems = ref<number[]>([]);
let lastSelectedIndex: number | null = null; //给shift用的

function onLiMousedown(index: number, e: MouseEvent) {
    //处理右键逻辑
    if (e.button == 2 && fileStore.fileList[index].selected) return;

    //要知道所有的li元素
    //获得触发事件的li元素
    if (!e.shiftKey && !e.ctrlKey) {
        //单选路线 没有按shift和ctrl键
        if (selectedItems.value.length > 0) {
            //除当前index外 全部清除
            selectedItems.value.forEach((i) => {
                if (i == index) return;
                fileStore.fileList[i].selected = false;
            });
        }

        //设置是否选中状态
        fileStore.fileList[index].selected = true;
        selectedItems.value = [index];
        lastSelectedIndex = index;

        // 以下逻辑，可以鼠标单击然后取消选中的项
        // if (currentFileMap.selected.value && selectedItems.value.length == 1) {
        //     currentFileMap.selected.value = false;
        //     selectedItems.value = [];
        //     lastSelectedIndex = null;
        // } else {
        //     currentFileMap.selected.value = true;
        //     selectedItems.value = [index];
        //     lastSelectedIndex = index;
        // }
        return;
    }

    if (e.shiftKey) {
        //shift多选路线
        if (selectedItems.value.length > 0) {
            //除当前index外 全部清除
            selectedItems.value.forEach((i) => {
                fileStore.fileList[i].selected = false;
            });
        }
        let start = 0;
        let end = 0;
        if (lastSelectedIndex === null) {
            end = index;
        } else {
            start = Math.min(lastSelectedIndex, index);
            end = Math.max(lastSelectedIndex, index);
        }
        const indexes = [];
        for (let i = start; i <= end; i++) {
            fileStore.fileList[i].selected = true;
            indexes.push(i);
        }
        selectedItems.value = indexes;
        return;
    }

    if (e.ctrlKey) {
        //ctrl多选路线
        //设置是否选中状态
        const itemIndex = selectedItems.value.indexOf(index);
        if (fileStore.fileList[index].selected && itemIndex > -1) {
            //设置不选中
            fileStore.fileList[index].selected = false;
            selectedItems.value.splice(itemIndex, 1);
        } else {
            fileStore.fileList[index].selected = true;
            selectedItems.value.push(index);
            lastSelectedIndex = index;
        }
        return;
    }
}

function addDivFocusoutEventListener() {
    document.addEventListener('click', onDivFocusout);
}

//当失去焦点时候，清楚所以选择的文件
function onDivFocusout(e: MouseEvent) {
    const div = <HTMLDivElement>document.querySelector('.container');
    if (div.contains(e.target as Node)) return;

    if (selectedItems.value.length > 0) {
        //选中状态全部清除
        selectedItems.value.forEach((i) => {
            fileStore.fileList[i].selected = false;
        });
        selectedItems.value = [];
        lastSelectedIndex = null;
    }
}
/** 处理文件列表选择 ------结束----*/

</script>

<template>
    <div class="container">
        <!-- 展示vpk文件 -->
        <el-scrollbar wrap-class="list">
            <div>
                <ul>
                    <li v-for="(item, index) in fileStore.fileList"
                        :class="{ selected: item.selected }"
                        @contextmenu.prevent="onContextmenu($event)" @mouseover="onMouseover(item, $event)"
                        @mousemove="onMousemove" @mousedown="onLiMousedown(index, $event)">
                        {{ item.file }}
                    </li>
                </ul>
            </div>
        </el-scrollbar>
        <div :class="['fileProperty', { hidden: !showProperty }]" :style="filePropertyStyle">
            <div>大小: {{ showItem?.size }}</div>
            <div>创建日期: {{ formatDate(showItem?.creationTime) }}</div>
        </div>
        <div class="statistics">
            <el-row>
                <el-col :span="8">
                    {{ fileStore.fileList.length }}个文件
                </el-col>
                <el-col :span="16">
                    已选择{{ selectedItems.length }}个文件
                </el-col>
            </el-row>
        </div>
    </div>

    <context-menu v-model:show="showContextmenu" :options="optionsComponent">
        <context-menu-item label="复制文件名" @click="onCopyFileName" />
        <context-menu-sperator />
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
    user-select: none;
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
    visibility: visible;
    opacity: 1;
    transition: opacity 0.5s ease-in-out;
}

.fileProperty.hidden {
    opacity: 0;
    transition: opacity 0.8s ease-in-out, visibility 0s 0.8s;
    visibility: hidden;
}

.mx-context-menu-item .label {
    font-size: 0.8rem;
    font-family: serif, sans-serif;
}

ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

li {
    padding: 10px;
    border-top: 1px solid #ccc;
    /* cursor: pointer; */
}

li.selected {
    background-color: #d6e1ea;
}

li:hover:not(.selected) {
    background-color: #e0e0e0;
}
</style>