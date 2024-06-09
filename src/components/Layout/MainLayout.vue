<script setup lang="ts">
import { ref } from 'vue';
import {ElMessageBox } from 'element-plus'

const isLoading = ref(false);
async function openAddonsFloder() {
    try {
        isLoading.value = true;
        let addonsPath = await ipcRenderer.invoke('get-addons-path');
        await ipcRenderer.openFolder(addonsPath);
        isLoading.value = false;
    } catch (error) {
        isLoading.value = false;
        alert(error);
    }
}

function openGameFolder(){
    // alert('暂未实现');
    ElMessageBox.alert('暂未实现')
}
</script>

<template>
    <div class="content">
        <el-button type="primary" @click="openAddonsFloder" plain :loading="isLoading">addons文件夹</el-button>
        <el-button type="primary" @click="openGameFolder" plain :loading="isLoading">l4d2文件夹</el-button>
    </div>
</template>

<style>
.content {
    /* flex: 1; */
    /* padding: 10px; */
    height: 100%;
    /* background-color: #fff; */
    
    /* background-color: #d5b2b2; */
    /* border-bottom: 1px solid #ccc; */
}
</style>