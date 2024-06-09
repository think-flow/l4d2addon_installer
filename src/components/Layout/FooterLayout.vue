<script setup lang="ts">
import { onMounted, ref } from 'vue'

const messages = ref([])

onMounted(() => {
    for (let index = 0; index < 12; index++) {
         messages.value.push({ time: new Date().toTimeString().split(' ')[0], msg: "lkjlkjsaldfjlskjdlkjfsldjflskjdflksjdlfkjsldfkjla蒋康双顶甲方龙ddddddddddddddaadsasdf" });
    }
    ipcRenderer.on('main-process-log-message', (_event, msg) => {
        messages.value.push({ time: new Date().toTimeString().split(' ')[0], msg: msg });
    })
})
</script>

<template>
    <el-scrollbar wrap-class="logs">
        <div>
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
    /* background-color: white; */
    height: 100%;
    margin-left: 2px;
}
.logs .time{
    margin-right: 2px;
    color: #f43030;
    font-size: 0.8em;
}
.logs .msg{
    color: grey;
    font-size: 0.9em;
}
</style>