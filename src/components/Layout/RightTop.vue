<script setup lang="ts">
async function  H() {
    try {
        let d=await ipcRenderer.invoke('get-l4d2-hellper');
        alert(d)
    } catch (error) {
        alert(error);
        console.log(error)
    }
}

</script>

<template>
    <div class="content">
        <!-- 右边上方的内容可以在这里添加 -->

        <button type="button" @click="H">点击我</button>
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