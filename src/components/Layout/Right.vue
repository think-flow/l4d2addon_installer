<script setup lang="ts">
import Top from './RightTop.vue';
import Bottom from './RightBottom.vue';
</script>

<template>
  <div class="right-column">
    <Top />
    <Bottom />
  </div>
</template>

<style>
.right-column {
  width: 75%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
</style>