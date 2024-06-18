<script setup lang="ts">
import AsideLayout from './components/Layout/AsideLayout.vue';
import MainLayout from './components/Layout/MainLayout.vue';
import FooterLayout from './components/Layout/FooterLayout.vue';
import { ref } from 'vue'
import { useAppConfigStore } from './stores/config';

let isDragging = false;
const containerDom = ref();
const appConfig = useAppConfigStore().config;


function onMouseMove(e: MouseEvent) {
  if (!isDragging) return;
  const containerWidth = containerDom.value.offsetWidth;
  const leftWidth = (e.clientX / containerWidth) * 100;
  // const rightWidth = 100 - leftWidth;

  //限制left最大和最小范围 10%-70%
  if (leftWidth < 10 || leftWidth > 70) return;
  appConfig.leftSideWidth = leftWidth;
  // console.log(`clientX:${e.clientX} containerWidth:${containerWidth} leftWidth:${leftWidth}`)
}

function stopDragging() {
  isDragging = false;
  document.body.style.cursor = 'default';
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', stopDragging);
}

function startDragging() {
  isDragging = true;
  document.body.style.cursor = 'ew-resize';
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', stopDragging);
}
</script>

<template>
  <div ref="containerDom">
    <el-container>
      <el-aside :width="appConfig.leftSideWidth + '%'">
        <AsideLayout />
      </el-aside>
      <div class="divider" @mousedown="startDragging">
      </div>
      <el-container>
        <el-main>
          <MainLayout />
        </el-main>
        <el-footer height="25vh">
          <FooterLayout />
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<style>
.divider {
  position: relative;
  width: 5px;
  background-color: transparent;
  cursor: ew-resize;
}

.divider::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  /* 为了使伪元素在中心对齐 */
  width: 7px;
  /* 实际可视宽度 */
  height: 100%;
  background-color: #cacaca;
  pointer-events: none;
}

.divider:hover::before {
  background-color: darkgray;
}
</style>