import CryptoJS from 'crypto-js'

export class SpeechTranscriber {
  constructor(options) {
    this.options = options
    this.ws = null
    this.recorder = null
    this.audioContext = null
    this.mediaStream = null
    this.isRecording = false
    this.audioBuffer = new Float32Array(0)
    this.sendInterval = null
    this.currentRole = 0  // 当前角色编号
    this.roleMap = new Map()  // 角色映射表
    
    // 讯飞配置
    this.config = {
      hostUrl: "wss://rtasr.xfyun.cn/v1/ws",
      appid: "c0ffb514",
      apiKey: "df0f7e05cbe086a4d0e9410250d5e316",
      audioConfig: {
        sampleRate: 16000,    // 采样率
        frameSize: 1280,      // 每帧大小（字节）
        intervalTime: 40      // 发送间隔（毫秒）
      },
      roleType: 2  // 开启角色分离
    }
  }

  async start() {
    try {
      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.audioConfig.sampleRate
      })
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      
      // 创建录音处理器
      this.recorder = this.audioContext.createScriptProcessor(2048, 1, 1)
      source.connect(this.recorder)
      this.recorder.connect(this.audioContext.destination)
      
      // 连接讯飞实时语音转写服务
      await this.connectWebSocket()
      
      // 开始录音
      this.isRecording = true
      this.recorder.onaudioprocess = this.handleAudioProcess.bind(this)
      
      // 启动定时发送
      this.startSendingAudio()
      
      this.options.onStatusChange?.('started')
    } catch (error) {
      this.cleanup()
      throw new Error('启动录音失败: ' + error.message)
    }
  }

  stop() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 发送结束帧
      this.ws.send(JSON.stringify({"end": true}))
    }
    
    this.isRecording = false
    this.cleanup()
    this.options.onStatusChange?.('stopped')
  }

  cleanup() {
    // 停止定时发送
    if (this.sendInterval) {
      clearInterval(this.sendInterval)
      this.sendInterval = null
    }

    // 清理WebSocket连接
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // 清理录音相关资源
    if (this.recorder) {
      this.recorder.disconnect()
      this.recorder = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    // 清理音频缓冲区
    this.audioBuffer = new Float32Array(0)
  }

  // 生成鉴权签名
  getSigna(ts) {
    const md5 = CryptoJS.MD5(this.config.appid + ts).toString()
    const sha1 = CryptoJS.HmacSHA1(md5, this.config.apiKey)
    const base64 = CryptoJS.enc.Base64.stringify(sha1)
    return encodeURIComponent(base64)
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      let ts = parseInt(new Date().getTime() / 1000)
      const wssUrl = `${this.config.hostUrl}?appid=${this.config.appid}&ts=${ts}&signa=${this.getSigna(ts)}&roleType=${this.config.roleType}`
      
      this.ws = new WebSocket(wssUrl)
      
      this.ws.onopen = () => {
        console.log('WebSocket连接已建立')
        resolve()
      }
      
      this.ws.onmessage = this.handleWebSocketMessage.bind(this)
      
      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        this.options.onError?.(error)
        reject(error)
      }
      
      this.ws.onclose = () => {
        console.log('WebSocket连接已关闭')
        this.options.onStatusChange?.('disconnected')
      }
    })
  }

  handleAudioProcess(e) {
    if (!this.isRecording) return

    // 获取音频数据并追加到缓冲区
    const newData = e.inputBuffer.getChannelData(0)
    const oldBuffer = this.audioBuffer
    const newBuffer = new Float32Array(oldBuffer.length + newData.length)
    newBuffer.set(oldBuffer)
    newBuffer.set(newData, oldBuffer.length)
    this.audioBuffer = newBuffer
  }

  startSendingAudio() {
    // 清理可能存在的旧定时器
    if (this.sendInterval) {
      clearInterval(this.sendInterval)
    }

    // 启动新的定时发送
    this.sendInterval = setInterval(() => {
      if (!this.isRecording || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return
      }

      // 计算需要发送的采样点数（1280字节 = 640个采样点，因为每个采样点是2字节）
      const samplesPerFrame = this.config.audioConfig.frameSize / 2
      
      if (this.audioBuffer.length >= samplesPerFrame) {
        // 从缓冲区取出要发送的数据
        const dataToSend = this.audioBuffer.slice(0, samplesPerFrame)
        this.audioBuffer = this.audioBuffer.slice(samplesPerFrame)

        // 转换为16位PCM并发送
        const pcmBuffer = this.floatTo16BitPCM(dataToSend)
        this.ws.send(pcmBuffer.buffer)
      }
    }, this.config.audioConfig.intervalTime)
  }

  handleWebSocketMessage(e) {
    try {
      const res = JSON.parse(e.data)
      
      switch (res.action) {
        case 'error':
          console.error(`错误码:${res.code} 描述:${res.desc}`)
          this.options.onError?.(new Error(res.desc))
          break
          
        case 'started':
          console.log('转写已启动, sid:', res.sid)
          break
          
        case 'result':
          const data = JSON.parse(res.data)
          // 处理所有结果
          if (data.cn && data.cn.st) {
            let text = ''
            data.cn.st.rt.forEach(item => {
              item.ws.forEach(ws => {
                ws.cw.forEach(cw => {
                  text += cw.w
                })
              })
            })
            
            // 处理角色信息
            const roleNumber = data.cn.st.rl || 0
            if (roleNumber > 0) {
              // 新角色出现时更新当前角色
              this.currentRole = roleNumber
            }
            
            const speaker = this.getSpeakerName(this.currentRole)
            
            // 调用回调函数，传递转写结果
            if (text.trim()) {
              console.log('讯飞返回结果:', {
                文本: text,
                类型: data.cn.st.type === "0" ? '最终结果' : '中间结果',
                原始type值: data.cn.st.type,
                角色编号: this.currentRole,
                角色变化: roleNumber > 0 ? `新角色${roleNumber}` : '继续说话'
              })
              
              this.options.onResult?.(text, {
                speaker,
                text,
                type: data.cn.st.type,
                roleNumber: this.currentRole
              })
            }
          }
          break
      }
    } catch (error) {
      console.error('处理WebSocket消息失败:', error)
      this.options.onError?.(error)
    }
  }

  // 根据角色编号获取说话人名称
  getSpeakerName(roleNumber) {
    if (roleNumber === 0) {
      return this.currentRole ? `说话人${this.currentRole}` : '说话人1'
    }
    return `说话人${roleNumber}`
  }

  // 工具方法：Float32Array转PCM
  floatTo16BitPCM(float32Array) {
    const length = float32Array.length
    const pcmBuffer = new Int16Array(length)
    
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    
    return pcmBuffer
  }
} 