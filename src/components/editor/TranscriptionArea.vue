<template>
  <div class="transcription-area">
    <div class="transcription-content" ref="contentRef">
      <div v-for="(item, index) in transcriptionItems" :key="index" class="transcription-item">
        <div class="message-content" :class="{ 'interim': !item.isFinal }">
          <div class="speaker-info">
            <div class="avatar">{{ item.speaker.charAt(0) }}</div>
            <div class="name">{{ item.speaker }}</div>
            <div class="time">{{ formatTime(item.timestamp) }}</div>
          </div>
          <div class="text">{{ item.text }}</div>
        </div>
      </div>
    </div>
    <!-- 底部控制栏 -->
    <div class="control-bar">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="wave-container">
        <canvas ref="waveCanvas" class="wave-canvas"></canvas>
      </div>

      <div class="controls">
        <div class="time-display">{{ formatDuration(recordingTime) }}</div>
        
        <div class="button-group">
          <button 
            class="record-button" 
            :class="{ 'recording': isRecording }"
            @click="toggleRecording"
          >
            <i class="icon-mic"></i>
          </button>

          <button class="function-button" @click="toggleAutoScroll">
            <i :class="['icon-scroll', { 'active': autoScroll }]"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { SpeechTranscriber } from './speech-transcriber'

// 响应式状态
const isRecording = ref(false)
const recordingTime = ref(0)
const progress = ref(0)
const autoScroll = ref(true)
const transcriptionItems = ref([])
const contentRef = ref(null)
const waveCanvas = ref(null)
let transcriber = null
let timerInterval = null
let animationFrame = null
let audioContext = null
let analyser = null

// 初始化
onMounted(() => {
  initializeWaveform()
})

// 清理
onUnmounted(() => {
  cleanup()
})

// 初始化波形图
function initializeWaveform() {
  const canvas = waveCanvas.value
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256

  function drawWave() {
    if (!isRecording.value) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.lineWidth = 2
    ctx.strokeStyle = '#ff4b4b'
    ctx.beginPath()

    const sliceWidth = canvas.width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = v * canvas.height / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    animationFrame = requestAnimationFrame(drawWave)
  }

  drawWave()
}

// 切换录音状态
async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

// 开始录音
async function startRecording() {
  try {
    transcriber = new SpeechTranscriber({
      onResult: handleTranscriptionResult,
      onError: handleError,
      onStatusChange: handleStatusChange
    })

    await transcriber.start()
    isRecording.value = true
    startTimer()
  } catch (error) {
    console.error('启动录音失败:', error)
  }
}

// 停止录音
function stopRecording() {
  if (transcriber) {
    transcriber.stop()
  }
  isRecording.value = false
  stopTimer()
}

// 处理转写结果
function handleTranscriptionResult(text, result) {
  console.group('转写结果处理')
  console.log('讯飞转写结果:', {
    文本内容: text,
    结果类型: result.type === "0" ? 'type="0"(最终结果)' : 'type="1"(中间结果)',
    说话人: result.speaker,
    角色编号: result.roleNumber,
    完整结果: result
  })
  
  const speaker = result.speaker
  const timestamp = Date.now()
  const roleNumber = result.roleNumber
  const isFinal = result.type === "0"

  // 获取最后一条记录
  const lastItem = transcriptionItems.value[transcriptionItems.value.length - 1]
  
  console.log('处理状态:', {
    有最后一条记录: !!lastItem,
    最后记录类型: lastItem ? (lastItem.isFinal ? '最终结果' : '中间结果') : '无记录',
    说话人: {
      当前: speaker,
      上一条: lastItem ? lastItem.speaker : '无记录',
      角色编号: roleNumber,
      角色是否变化: lastItem ? lastItem.roleNumber !== roleNumber : false
    }
  })

  // 判断是否需要创建新段落
  const shouldCreateNewSegment = !lastItem || // 没有上一条记录
                                lastItem.isFinal || // 上一条是最终结果
                                lastItem.roleNumber !== roleNumber; // 说话人变化

  if (!shouldCreateNewSegment && !lastItem.isFinal) {
    // 更新现有中间结果
    console.log('操作类型: 更新中间结果')
    console.log('更新详情:', {
      更新前: {
        文本: lastItem.text,
        说话人: lastItem.speaker,
        角色编号: lastItem.roleNumber
      },
      更新后: {
        文本: text,
        说话人: speaker,
        角色编号: roleNumber
      }
    })

    lastItem.text = text
    lastItem.timestamp = timestamp
    lastItem.isFinal = isFinal
  } else {
    // 创建新段落
    console.log('操作类型: 创建新段落')
    console.log('创建原因:', 
      !lastItem ? '无上一条记录' :
      lastItem.isFinal ? '上一条是最终结果' :
      lastItem.roleNumber !== roleNumber ? '说话人变化' : '其他原因'
    )

    transcriptionItems.value.push({
      speaker,
      text,
      timestamp,
      roleNumber,
      isFinal
    })
  }

  console.log('转写列表状态:', {
    总条数: transcriptionItems.value.length,
    最终结果数: transcriptionItems.value.filter(item => item.isFinal).length,
    中间结果数: transcriptionItems.value.filter(item => !item.isFinal).length,
    角色统计: countRoles(transcriptionItems.value)
  })
  console.groupEnd()

  // 强制Vue更新视图
  transcriptionItems.value = [...transcriptionItems.value]

  if (autoScroll.value) {
    // 使用nextTick确保在DOM更新后滚动
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 统计角色出现次数
function countRoles(items) {
  const roleCount = new Map()
  items.forEach(item => {
    const count = roleCount.get(item.roleNumber) || 0
    roleCount.set(item.roleNumber, count + 1)
  })
  return Object.fromEntries(Array.from(roleCount.entries()).map(([role, count]) => [
    `说话人${role}`, count
  ]))
}

// 处理错误
function handleError(error) {
  console.error('转写错误:', error)
}

// 处理状态变化
function handleStatusChange(status) {
  console.log('状态变化:', status)
}

// 计时器相关
function startTimer() {
  recordingTime.value = 0
  timerInterval = setInterval(() => {
    recordingTime.value++
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// 工具函数
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function scrollToBottom() {
  if (contentRef.value) {
    contentRef.value.scrollTop = contentRef.value.scrollHeight
  }
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
}

function cleanup() {
  stopRecording()
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  if (audioContext) {
    audioContext.close()
  }
}
</script>

<style lang="scss" scoped>
.transcription-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;

  .transcription-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    padding-bottom: 100px; // 为控制栏留出空间
    
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #c0c4cc;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: #f5f7fa;
    }

    .transcription-item {
      margin-bottom: 16px;

      .message-content {
        background: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;

        &.interim {
          background: #f0f9ff;
          border: 1px dashed #91caff;
          
          .text {
            color: #666;
            font-style: italic;
          }
        }

        .speaker-info {
          display: flex;
          align-items: center;
          margin-bottom: 10px;

          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #e6f7ff;
            color: #1890ff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
          }

          .name {
            font-weight: 500;
            color: #333;
            margin-right: 10px;
          }

          .time {
            color: #999;
            font-size: 12px;
          }
        }

        .text {
          color: #333;
          line-height: 1.6;
          font-size: 14px;
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }
  }

  .control-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 10;
    display: flex;
    flex-direction: column;

    .progress-bar {
      height: 2px;
      background: #f0f0f0;
      position: relative;
    }

    .progress {
      position: absolute;
      height: 100%;
      background: #1890ff;
      transition: width 0.3s;
    }

    .wave-container {
      height: 40px;
      padding: 5px;
      background: rgba(0, 0, 0, 0.02);
    }

    .wave-canvas {
      width: 100%;
      height: 100%;
    }

    .controls {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .time-display {
      font-family: monospace;
      font-size: 16px;
      color: #333;
    }

    .button-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .record-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: #ff4b4b;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.05);
      }

      &.recording {
        animation: pulse 2s infinite;
      }
    }

    .function-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: white;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }
    }

    .icon-mic, .icon-scroll {
      font-size: 20px;
    }

    .icon-scroll.active {
      color: #1890ff;
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 75, 75, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 75, 75, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 75, 75, 0);
  }
}
</style> 