<script setup lang="ts">
import AsideLayout from './components/Layout/AsideLayout.vue';
import MainLayout from './components/Layout/MainLayout.vue';
import FooterLayout from './components/Layout/FooterLayout.vue';
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="25%">
        <AsideLayout />
      </el-aside>
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
