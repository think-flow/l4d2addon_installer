<script>

let clickCount = 0;
let clickTimer = null;
document.body.addEventListener('click', function (event) {
    // 每次点击时，增加点击计数器  
    clickCount++;
    console.log(clickCount)
    // 设置一个定时器来检查是否是三击  
    if (!clickTimer) {
        clickTimer = setTimeout(function () {
            if (clickCount >= 3) {
                window.ipcRenderer.invoke('fireworks')
            }
            clickCount = 0;
            clickTimer = null;
        }, 500);
    }
});

</script>

<template>
    <div>这是about页面</div>
</template>

<style scoped>
div {
    height: 100vh;
    width: 100%;
}
</style>