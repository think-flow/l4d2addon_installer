<template>
  <div class="right-column">
    <div class="content">
      <!-- 右边上方的内容可以在这里添加 -->
    </div>
    <div class="logs">
      <!-- <pre id="log-output"></pre> -->
      <div>[11:57:58] Data loaded successfully</div>
      <div>[11:57:58] Data loaded successfully</div>
    </div>
  </div>
</template>

<style>
.right-column {
  width: 75%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.content {
  flex: 1;
  padding: 10px;
  background-color: #fff;
  border-bottom: 1px solid #ccc;
}

.logs {
  padding: 10px;
  background-color: #f9f9f9;
  height: 25%;
  overflow-y: auto;
}
</style>