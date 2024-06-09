<script setup lang="ts">
import { onMounted, ref } from 'vue'

const messages = ref([])
const scrollbarRef = ref()
const innerScrollbarRef = ref()

onMounted(() => {
    ipcRenderer.on('main-process-log-message', (_event, msg) => {
        messages.value.push({ time: new Date().toTimeString().split(' ')[0], msg: msg });
        //设置滚动条到最底部
        setTimeout(() => {
            scrollbarRef.value!.setScrollTop(innerScrollbarRef.value!.clientHeight)
        }, 100)
    })
})
</script>

<template>
    <el-scrollbar wrap-class="logs" ref="scrollbarRef">
        <div ref="innerScrollbarRef">
            <div v-for="message in messages">
                <span class="time">{{ message.time }}</span>
                <span class="msg">{{ message.msg }}</span>
            </div>
        </div>
    </el-scrollbar>
</template>

<style>
.logs {
    background-color: #f9f9f9;
    height: 100%;
    margin-left: 2px;
}

.logs .time {
    margin-right: 2px;
    color: #f43030;
    font-size: 0.8em;
}

.logs .msg {
    color: grey;
    font-size: 0.9em;
}
</style>