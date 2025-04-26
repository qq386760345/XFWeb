<template>
  <div class="editor-container">
    <EditorHeader />
    <div class="main-content">
      <TranscriptionArea class="transcription-section" />
      <div class="editor-area">
        <div class="toolbar">
          <el-button-group>
            <el-button size="small">
              <el-icon><Document /></el-icon>
              新建
            </el-button>
            <el-button size="small">
              <el-icon><FolderOpened /></el-icon>
              打开
            </el-button>
            <el-button size="small" type="primary">
              <el-icon><Select /></el-icon>
              保存
            </el-button>
          </el-button-group>
        </div>
        <div class="content">
          <el-input
            v-model="editorContent"
            type="textarea"
            :rows="20"
            placeholder="在这里输入或编辑文本..."
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Document, FolderOpened, Select } from '@element-plus/icons-vue'
import EditorHeader from '../components/editor/EditorHeader.vue'
import TranscriptionArea from '../components/editor/TranscriptionArea.vue'

const editorContent = ref('')
</script>

<style lang="scss" scoped>
.editor-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.transcription-section {
  width: 50%;
  position: relative;
  border-right: 1px solid #e6e6e6;
}

.editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  min-width: 0; // 防止flex子元素溢出
  
  .toolbar {
    height: 40px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e6e6e6;
  }

  .content {
    flex: 1;
    padding: 20px;
    overflow: auto;

    :deep(.el-textarea) {
      height: 100%;

      .el-textarea__inner {
        height: 100%;
        resize: none;
        border: none;
        padding: 0;
        font-size: 14px;
        line-height: 1.8;
        color: #333;
        background: transparent;

        &:focus {
          box-shadow: none;
        }
      }
    }
  }
}
</style> 