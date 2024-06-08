<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'


const files = reactive([])
const showMenu = ref(false)
const menuY = ref(0)
const menuX = ref(0)

onMounted(async () => {
    const datas = await ipcRenderer.invoke('get-vpk-files');

    console.log(datas);

    datas.forEach(data => {
        files.push(data)
    });
})

function handleRightClick(event) {
    console.log(event)
    menuX.value = event.clientX
    menuY.value = event.clientY
    showMenu.value = true
}


</script>

<template>
    <div class="left-column">
        <!-- 展示vpk文件 -->
        <ul>
            <li v-for="item in files" @contextmenu.prevent="handleRightClick">
                {{ item.file }}
            </li>
        </ul>

        <!-- 右键菜单 -->
        <div v-if="showMenu" :style="{ top: menuY + 'px', left: menuX + 'px' }" class="custom-menu">
            <div class="menu-item">删除</div>
        </div>
    </div>


</template>

<style>
.left-column {
    width: 25%;
    background-color: #f0f0f0;
    box-sizing: border-box;
    border-right: 1px solid #ccc;
    overflow: scroll;
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

.custom-menu {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    padding: 10px;
    z-index: 1000;
}

.menu-item {
    padding: 5px 10px;
    cursor: pointer;
}

.menu-item:hover {
    background-color: #e0e0e0;
}
</style>