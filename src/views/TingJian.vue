<template>
  <div class="tingjian">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="logo">
        <img src="../assets/logo.png" alt="Logo">
        <span>讯飞听见</span>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="handleStartExperience">开始体验</el-button>
        <el-button type="primary" size="small">导入文件</el-button>
        <el-input
          v-model="searchText"
          placeholder="搜索"
          prefix-icon="Search"
          size="small"
          style="width: 200px"
        />
      </div>
    </div>

    <!-- 左侧菜单 -->
    <div class="main-content">
      <div class="sidebar">
        <el-menu
          default-active="1"
          class="sidebar-menu"
        >
          <el-menu-item index="1">
            <el-icon><Document /></el-icon>
            <span>最近文件</span>
          </el-menu-item>
          <el-menu-item index="2">
            <el-icon><Folder /></el-icon>
            <span>我的文件</span>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon><Star /></el-icon>
            <span>收藏文件</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon><Delete /></el-icon>
            <span>回收站</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主要内容区域 -->
      <div class="content">
        <div class="empty-state">
          <el-empty
            description="暂无文件，快去体验吧"
            :image-size="200"
          >
            <template #image>
              <img src="../assets/empty-image.svg" alt="empty">
            </template>
            <template #default>
              <el-button type="primary" @click="handleStartExperience">立即体验</el-button>
            </template>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Folder, Star, Delete, Search } from '@element-plus/icons-vue'

const router = useRouter()
const searchText = ref('')

const handleStartExperience = () => {
  router.push('/editor')
}
</script>

<style lang="scss" scoped>
.tingjian {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;

  .header {
    height: 60px;
    background: #fff;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;

      img {
        height: 32px;
      }

      span {
        font-size: 18px;
        font-weight: bold;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .sidebar {
      width: 200px;
      background: #fff;
      border-right: 1px solid #e6e6e6;

      .sidebar-menu {
        border-right: none;
      }

      .el-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;

      .empty-state {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #909399;
      }
    }
  }
}
</style> 