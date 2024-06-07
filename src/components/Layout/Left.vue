<script setup lang="ts">
import { onMounted, reactive } from 'vue'


const files = reactive([])

onMounted(async () => {
    const datas = await ipcRenderer.invoke('get-vpk-files');
    console.log(datas);
    datas.forEach(data => {
        files.push(data)
    });
})
</script>

<template>
    <div class="left-column">
        <!-- 展示vpk文件 -->
        <ul>
            <li v-for="item in files">
                {{ item.fileWithoutEx }}
            </li>
        </ul>
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
</style>