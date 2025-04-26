// 定义并导出类
window.SpeechToText = class SpeechToText {
    constructor() {
        console.log('开始初始化语音转写系统...');
        
        // 获取DOM元素
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.editor = document.getElementById('editor');
        this.status = document.getElementById('status');
        this.logArea = document.getElementById('logArea');

        // 验证必要的DOM元素
        if (!this.startBtn || !this.stopBtn || !this.editor || !this.status || !this.logArea) {
            const error = '页面初始化失败：无法找到必要的DOM元素';
            console.error(error);
            alert(error);
            return;
        }

        // 初始化变量
        this.audioContext = null;
        this.mediaStream = null;
        this.websocket = null;
        this.isRecording = false;
        this.processor = null;
        this.audioDataCount = 0;

        // 绑定事件
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());

        // 添加初始日志
        console.log('正在写入初始日志...');
        this.log('语音转写系统初始化完成', 'success');
        console.log('语音转写系统初始化完成');
    }

    log(message, type = 'info') {
        // 控制台输出
        const consoleMsg = `[${type.toUpperCase()}] ${message}`;
        switch (type) {
            case 'error':
                console.error(consoleMsg);
                break;
            case 'success':
                console.log('%c' + consoleMsg, 'color: green');
                break;
            default:
                console.log('%c' + consoleMsg, 'color: blue');
        }

        // 界面输出
        try {
            if (!this.logArea) {
                console.error('日志区域不存在！');
                return;
            }
            
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type}`;
            const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            entry.textContent = `[${time}] ${message}`;
            
            this.logArea.appendChild(entry);
            this.logArea.scrollTop = this.logArea.scrollHeight;
        } catch (error) {
            console.error('写入界面日志失败:', error);
        }
    }

    async startRecording() {
        try {
            this.log('正在请求麦克风权限...');
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.log('已获取麦克风权限', 'success');
            
            // 先建立 WebSocket 连接
            this.log('正在连接 WebSocket 服务器...');
            try {
                await this.connectWebSocket();
                this.log('WebSocket 连接成功', 'success');
            } catch (wsError) {
                this.log(`WebSocket 连接失败: ${wsError.message}`, 'error');
                throw wsError;
            }

            this.log('正在初始化音频上下文...');
            this.audioContext = new AudioContext();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(16384, 1, 1);
            this.log(`音频上下文已初始化，采样率: ${this.audioContext.sampleRate}Hz`, 'success');

            this.audioDataCount = 0;
            this.processor.onaudioprocess = (e) => {
                if (!this.isRecording) {
                    this.log('录音已停止，不再处理音频数据');
                    return;
                }
                if (!this.websocket) {
                    this.log('WebSocket 未连接，无法发送音频数据', 'error');
                    return;
                }
                if (this.websocket.readyState !== WebSocket.OPEN) {
                    this.log(`WebSocket 状态异常: ${this.websocket.readyState}`, 'error');
                    return;
                }

                try {
                    const audioData = e.inputBuffer.getChannelData(0);
                    const pcmData = this.float32ToInt16(audioData);
                    const audioMessage = {
                        header: {
                            message_id: String(Date.now()),
                            task_id: String(Date.now()),
                            namespace: 'SpeechTranscriber',
                            name: 'SendAudio'
                        },
                        payload: {
                            data: Array.from(pcmData)
                        }
                    };
                    this.websocket.send(JSON.stringify(audioMessage));
                    
                    this.audioDataCount++;
                    if (this.audioDataCount % 10 === 0) {
                        this.log(`已发送 ${this.audioDataCount} 帧音频数据`);
                    }
                } catch (error) {
                    this.log(`发送音频数据失败: ${error.message}`, 'error');
                }
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecording = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.updateStatus('正在录音...');
            this.log('录音已开始', 'success');
        } catch (error) {
            console.error('启动录音失败:', error);
            this.updateStatus('启动录音失败: ' + error.message);
            this.log(`录音启动失败: ${error.message}`, 'error');
            // 清理资源
            this.stopRecording();
        }
    }

    stopRecording() {
        this.log('正在停止录音...');
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
            this.log('已停止麦克风录制');
        }

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
            this.log('已断开音频处理器');
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.log('已关闭音频上下文');
        }

        if (this.websocket) {
            const endFrame = {
                header: {
                    message_id: String(Date.now()),
                    task_id: String(Date.now()),
                    namespace: 'SpeechTranscriber',
                    name: 'StopTranscription'
                }
            };
            this.websocket.send(JSON.stringify(endFrame));
            this.log('已发送停止识别命令');
            this.websocket.close();
            this.websocket = null;
            this.log('已关闭WebSocket连接');
        }

        this.isRecording = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.updateStatus('录音已停止');
        this.log(`本次录音共发送 ${this.audioDataCount} 帧音频数据`, 'success');
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = 'wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1?token=bd28e911edcb49ec845a1fc90c281c0a';
                this.log(`正在连接 WebSocket: ${wsUrl}`);
                
                this.websocket = new WebSocket(wsUrl);
                
                this.websocket.onopen = () => {
                    this.log('WebSocket 连接已建立，正在发送开始帧...');
                    try {
                        const startFrame = {
                            header: {
                                message_id: String(Date.now()),
                                task_id: String(Date.now()),
                                namespace: 'SpeechTranscriber',
                                name: 'StartTranscription',
                                appkey: 'Clk3jnOJJ39uJWsf'
                            },
                            payload: {
                                format: 'pcm',
                                sample_rate: 16000,
                                enable_intermediate_result: true,
                                enable_punctuation_prediction: true,
                                enable_inverse_text_normalization: true
                            }
                        };
                        this.websocket.send(JSON.stringify(startFrame));
                        this.log('开始帧发送成功');
                        this.updateStatus('WebSocket已连接');
                        resolve();
                    } catch (error) {
                        this.log(`发送开始帧失败: ${error.message}`, 'error');
                        reject(error);
                    }
                };

                this.websocket.onmessage = (event) => {
                    try {
                        const response = JSON.parse(event.data);
                        this.log(`收到消息: ${response.header.name}`);
                        if (response.header.name === 'TranscriptionResultChanged' ||
                            response.header.name === 'TranscriptionCompleted') {
                            const text = response.payload.result;
                            this.editor.value += text + ' ';
                            this.log(`收到识别结果: ${text}`);
                        }
                    } catch (error) {
                        this.log(`处理 WebSocket 消息失败: ${error.message}`, 'error');
                    }
                };

                this.websocket.onerror = (error) => {
                    const errorMsg = `WebSocket 错误: ${error.message || '未知错误'}`;
                    this.log(errorMsg, 'error');
                    this.updateStatus('WebSocket连接错误');
                    reject(new Error(errorMsg));
                };

                this.websocket.onclose = (event) => {
                    const closeMsg = `WebSocket 连接关闭: code=${event.code}, reason=${event.reason || '未知原因'}`;
                    this.log(closeMsg);
                    this.updateStatus('WebSocket连接已关闭');
                    if (this.isRecording) {
                        this.stopRecording();
                    }
                };
            } catch (error) {
                const errorMsg = `创建 WebSocket 失败: ${error.message}`;
                this.log(errorMsg, 'error');
                reject(new Error(errorMsg));
            }
        });
    }

    float32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    updateStatus(message) {
        this.status.textContent = '状态：' + message;
    }
}

// 确保在页面加载完成后自动初始化
window.addEventListener('load', () => {
    console.log('页面加载完成，准备初始化...');
    try {
        window.speechToText = new window.SpeechToText();
        console.log('应用初始化成功');
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
}); 