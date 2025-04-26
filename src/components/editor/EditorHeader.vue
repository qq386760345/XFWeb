<template>
  <div class="header">
    <div class="left">
      <router-link to="/tingjian" class="back">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </router-link>
      <span class="title">4月26日录音</span>
    </div>
    <div class="right">
      <el-button size="small">
        <el-icon><Share /></el-icon>
        分享
      </el-button>
      <el-button size="small">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button type="primary" size="small">
        <el-icon><Select /></el-icon>
        保存
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, Share, Download, Select } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.header {
  height: 50px;
  flex-shrink: 0;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
  z-index: 2;

  .left {
    display: flex;
    align-items: center;
    gap: 20px;

    .back {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #606266;
      text-decoration: none;

      &:hover {
        color: #409EFF;
      }
    }

    .title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .right {
    display: flex;
    gap: 10px;
  }
}
</style> 