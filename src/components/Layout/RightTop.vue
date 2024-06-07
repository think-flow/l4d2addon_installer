<script setup lang="ts">

async function openAddonsFloder() {
    try {
        let addonsPath = await ipcRenderer.invoke('get-addons-path');
        await ipcRenderer.openFolder(addonsPath);
    } catch (error) {
        alert(error);
    }
}

</script>

<template>
    <div class="content">
        <!-- 右边上方的内容可以在这里添加 -->
        <button type="button" @click="openAddonsFloder">addons文件夹</button>
    </div>
</template>

<style>
.content {
    flex: 1;
    padding: 10px;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
}
</style>