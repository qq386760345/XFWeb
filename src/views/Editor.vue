<template>
  <div class="editor">
    <!-- 顶部导航 -->
    <div class="header">
      <div class="left">
        <router-link to="/tingjian" class="back">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </router-link>
        <span class="title">4月25日录音</span>
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

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧原文区域 -->
      <div class="text-area">
        <div class="toolbar">
          <div class="left">
            <el-radio-group v-model="textType" size="small">
              <el-radio-button label="笔记">笔记</el-radio-button>
              <el-radio-button label="AI纠错">AI纠错</el-radio-button>
              <el-radio-button label="思维导图">思维导图</el-radio-button>
              <el-radio-button label="AI问一问">AI问一问</el-radio-button>
            </el-radio-group>
          </div>
          <div class="right">
            <el-button-group>
              <el-button size="small">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small">
                <el-icon><EditPen /></el-icon>
              </el-button>
              <el-button size="small">
                <el-icon><Reading /></el-icon>
              </el-button>
              <el-button size="small">
                <el-icon><List /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>
        <div class="editor-content">
          <div class="audio-wave" v-if="isRecording || audioUrl">
            <div class="wave-container">
              <div v-if="isRecording" v-for="(bar, index) in waveBars" :key="index" 
                   class="wave-bar" 
                   :style="{ height: bar + '%' }">
              </div>
              <div v-else class="recording-finished">
                <el-button type="primary" @click="downloadAudio">
                  <el-icon><Download /></el-icon>
                  下载录音 (WAV)
                </el-button>
                <el-button @click="discardAudio">
                  <el-icon><Delete /></el-icon>
                  放弃录音
                </el-button>
              </div>
            </div>
            <div class="recording-time">
              {{ isRecording ? formatTime(recordingTime) : '录音完成' }}
            </div>
          </div>
          <el-input
            v-model="content"
            type="textarea"
            :rows="20"
            placeholder="请输入文字内容..."
          />
        </div>
      </div>

      <!-- 底部音频控制器 -->
      <div class="audio-controller">
        <div class="time">{{ formatTime(recordingTime) }}</div>
        <div class="controls">
          <el-button-group>
            <el-button size="small" :disabled="isRecording">
              <el-icon><CaretRight /></el-icon>
            </el-button>
            <el-button size="small" :disabled="isRecording">
              <el-icon><VideoPause /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        <div class="progress">
          <el-slider v-model="progress" :show-tooltip="false" :disabled="isRecording" />
        </div>
        <div class="time">00:00</div>
        <div class="extra-controls">
          <el-button-group>
            <el-button 
              size="small" 
              :type="isRecording ? 'danger' : 'default'"
              @click="toggleRecording"
            >
              <el-icon><Microphone /></el-icon>
              {{ isRecording ? '停止录音' : '开始录音' }}
            </el-button>
            <el-button size="small" :disabled="isRecording">
              <el-icon><Setting /></el-icon>
            </el-button>
            <el-button size="small" :disabled="isRecording">
              <el-icon><Timer /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ArrowLeft,
  Share,
  Download,
  Delete,
  Select,
  Edit,
  EditPen,
  Reading,
  List,
  CaretRight,
  VideoPause,
  Microphone,
  Setting,
  Timer
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const textType = ref('笔记')
const content = ref('')
const progress = ref(0)

// 录音相关状态
const isRecording = ref(false)
const recordingTime = ref(0)
const mediaRecorder = ref(null)
const audioChunks = ref([])
const waveBars = ref(Array(50).fill(20))
const animationFrameId = ref(null)
let recordingInterval = null

// 新增音频URL状态
const audioUrl = ref(null)
const audioBlob = ref(null)

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 更新音波
const updateWaveBars = () => {
  waveBars.value = waveBars.value.map(() => 
    Math.random() * 60 + 20
  )
  if (isRecording.value) {
    animationFrameId.value = requestAnimationFrame(updateWaveBars)
  }
}

// 获取支持的媒体格式
const getSupportedMimeType = () => {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ]
  return types.find(type => MediaRecorder.isTypeSupported(type)) || ''
}

// 将音频数据转换为WAV格式
const convertToWav = async (audioBlob) => {
  // 创建音频上下文
  const audioContext = new AudioContext({
    sampleRate: 16000
  })
  
  // 读取音频数据
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // 创建新的单声道音频缓冲区
  const wavBuffer = audioContext.createBuffer(1, audioBuffer.length, 16000)
  
  // 如果是立体声，将其混合为单声道
  const channelData = new Float32Array(audioBuffer.length)
  if (audioBuffer.numberOfChannels > 1) {
    // 混合多个声道
    for (let i = 0; i < audioBuffer.length; i++) {
      let sum = 0
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i]
      }
      channelData[i] = sum / audioBuffer.numberOfChannels
    }
  } else {
    channelData.set(audioBuffer.getChannelData(0))
  }
  
  // 写入单声道数据
  wavBuffer.getChannelData(0).set(channelData)
  
  // 创建WAV文件
  const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)
    
    // WAV文件头
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    // 写入WAV头
    writeString(view, 0, 'RIFF')  // RIFF标识
    view.setUint32(4, 36 + samples.length * 2, true)  // 文件大小
    writeString(view, 8, 'WAVE')  // WAVE标识
    writeString(view, 12, 'fmt ')  // fmt标识
    view.setUint32(16, 16, true)  // fmt块大小
    view.setUint16(20, 1, true)   // 音频格式 (PCM)
    view.setUint16(22, 1, true)   // 单声道
    view.setUint32(24, sampleRate, true)  // 采样率
    view.setUint32(28, sampleRate * 2, true)  // 字节率
    view.setUint16(32, 2, true)   // 块对齐
    view.setUint16(34, 16, true)  // 采样位数
    writeString(view, 36, 'data')  // data标识
    view.setUint32(40, samples.length * 2, true)  // 数据大小
    
    // 写入音频数据
    const volume = 0.8
    let index = 44
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(index, samples[i] * 0x7FFF * volume, true)
      index += 2
    }
    
    return buffer
  }
  
  // 生成WAV数据
  const wavData = encodeWAV(channelData, 16000)
  return new Blob([wavData], { type: 'audio/wav' })
}

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        sampleSize: 16,
        echoCancellation: true,
        noiseSuppression: true
      }
    })

    const mimeType = getSupportedMimeType()
    if (!mimeType) {
      throw new Error('浏览器不支持音频录制')
    }

    mediaRecorder.value = new MediaRecorder(stream, {
      mimeType: mimeType
    })
    audioChunks.value = []

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data)
    }

    mediaRecorder.value.onstop = async () => {
      const rawBlob = new Blob(audioChunks.value, { type: mimeType })
      try {
        audioBlob.value = await convertToWav(rawBlob)
        audioUrl.value = URL.createObjectURL(audioBlob.value)
        ElMessage.success('录音完成')
      } catch (error) {
        console.error('音频转换失败:', error)
        ElMessage.error('音频处理失败')
      }
    }

    mediaRecorder.value.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval = setInterval(() => {
      recordingTime.value++
    }, 1000)
    updateWaveBars()
  } catch (err) {
    console.error('录音失败:', err)
    ElMessage.error(err.message || '无法访问麦克风')
  }
}

// 下载音频
const downloadAudio = () => {
  if (audioBlob.value) {
    const downloadLink = document.createElement('a')
    downloadLink.href = audioUrl.value
    downloadLink.download = `录音_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.wav`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    ElMessage.success('开始下载录音文件')
  }
}

// 放弃录音
const discardAudio = () => {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = null
    audioBlob.value = null
    ElMessage.info('已放弃录音')
  }
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.stop()
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
    clearInterval(recordingInterval)
    cancelAnimationFrame(animationFrameId.value)
    isRecording.value = false
  }
}

// 组件卸载时清理
onUnmounted(() => {
  stopRecording()
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
})
</script>

<style lang="scss" scoped>
.editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;

  .header {
    height: 50px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e6e6e6;

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

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .text-area {
      flex: 1;
      padding: 20px;
      overflow-y: auto;

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .editor-content {
        height: calc(100% - 60px);
        position: relative;
        
        .audio-wave {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
          background: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

          .wave-container {
            display: flex;
            align-items: center;
            gap: 2px;
            height: 100px;
            width: 300px;

            .recording-finished {
              width: 100%;
              display: flex;
              justify-content: center;
              gap: 10px;
            }

            .wave-bar {
              flex: 1;
              background: #409EFF;
              border-radius: 2px;
              transition: height 0.1s ease;
            }
          }

          .recording-time {
            text-align: center;
            margin-top: 10px;
            font-size: 16px;
            color: #409EFF;
          }
        }

        :deep(.el-textarea__inner) {
          height: 100%;
          resize: none;
          border: none;
          padding: 0;
          font-size: 14px;
          line-height: 1.8;

          &:focus {
            box-shadow: none;
          }
        }
      }
    }

    .audio-controller {
      height: 60px;
      border-top: 1px solid #e6e6e6;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 20px;

      .time {
        font-size: 14px;
        color: #606266;
        width: 50px;
      }

      .progress {
        flex: 1;
      }

      .controls, .extra-controls {
        display: flex;
        gap: 10px;
      }

      .extra-controls {
        .el-button {
          min-width: 90px;
        }
      }
    }
  }
}
</style> 