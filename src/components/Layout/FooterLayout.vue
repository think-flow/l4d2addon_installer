<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useLoggerStore } from '../../stores/logger'

const scrollbarRef = ref()
const innerScrollbarRef = ref()
const logger = useLoggerStore()

onMounted(() => {
    window.ipcRenderer.on('main-process-log-message', (_event: any, msg: string) => {
        logger.logMsg(msg);
    });
    window.ipcRenderer.on('main-process-log-error', (_event: any, msg: string) => {
        logger.logError(msg);
    });
})

watch(logger.logs, () => {
    setScrollBottom();
})

//设置滚动条到最底部
function setScrollBottom() {
    setTimeout(() => {
        scrollbarRef.value!.setScrollTop(innerScrollbarRef.value!.clientHeight)
    }, 100)
}
</script>

<template>
    <el-scrollbar wrap-class="logs" ref="scrollbarRef">
        <div ref="innerScrollbarRef">
            <div v-for="log in logger.logs">
                <span class="time">{{ log.time.toTimeString().split(' ')[0] }}</span>
                <span :class="log.type">{{ log.msg }}</span>
            </div>
        </div>
    </el-scrollbar>
</template>

<style>
.logs {
    background-color: #f9f9f9;
    height: 100%;
    padding-left: 5px;
    border-top: 1px solid var(--el-border-color);
}

.logs .time {
    margin-right: 10px;
    color: #808080c2;
    font-size: 0.8em;
    font-family: serif, sans-serif;
}

.logs .message {
    color: #000000a3;
    font-size: 0.9em;
    font-family: serif, sans-serif;
}

.logs .error {
    color: #fe6666;
    font-size: 0.9em;
    font-family: serif, sans-serif;
}
</style>