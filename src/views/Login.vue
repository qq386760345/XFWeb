<template>
  <div class="login-container">
    <div class="particles">
      <div v-for="i in 20" :key="i" class="particle"></div>
    </div>
    <div class="floating-dots">
      <div v-for="i in 10" :key="'float-' + i" class="floating-dot"></div>
    </div>
    <div class="orbiting-dots">
      <div v-for="i in 5" :key="'orbit-' + i" class="orbiting-dot"></div>
    </div>
    <div class="login-box" :class="{ 'animate-in': showForm }">
      <div class="login-header">
        <h2>欢迎登录</h2>
        <p>探索无限可能</p>
      </div>
      <el-form @submit.prevent="handleLogin" class="login-form">
        <el-form-item>
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            class="login-btn"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
        <div class="register-link">
          还没有账号？
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const showForm = ref(false)
const loading = ref(false)

const form = ref({
  phone: '',
  password: ''
})

onMounted(() => {
  setTimeout(() => {
    showForm.value = true
  }, 300)
})

const handleLogin = async () => {
  if (!form.value.phone || !form.value.password) {
    ElMessage.warning('请输入手机号和密码')
    return
  }
  
  loading.value = true
  try {
    await authStore.login(form.value)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  position: relative;
  overflow: hidden;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: float 15s infinite linear;
}

@keyframes float {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(100px);
    opacity: 0;
  }
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform: translateY(50px);
  opacity: 0;
  transition: all 0.5s ease;
}

.login-box.animate-in {
  transform: translateY(0);
  opacity: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  color: #fff;
  font-size: 32px;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.login-header p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
}

.login-form {
  margin-top: 20px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: none;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-input__prefix-inner) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.register-link {
  margin-top: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.link {
  color: #ff6b6b;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
}

.link:hover {
  color: #ff8e8e;
  text-decoration: underline;
}

/* 为每个粒子设置不同的动画延迟 */
.particle:nth-child(1) { animation-delay: 0s; left: 10%; }
.particle:nth-child(2) { animation-delay: 0.5s; left: 20%; }
.particle:nth-child(3) { animation-delay: 1s; left: 30%; }
.particle:nth-child(4) { animation-delay: 1.5s; left: 40%; }
.particle:nth-child(5) { animation-delay: 2s; left: 50%; }
.particle:nth-child(6) { animation-delay: 2.5s; left: 60%; }
.particle:nth-child(7) { animation-delay: 3s; left: 70%; }
.particle:nth-child(8) { animation-delay: 3.5s; left: 80%; }
.particle:nth-child(9) { animation-delay: 4s; left: 90%; }
.particle:nth-child(10) { animation-delay: 4.5s; left: 15%; }
.particle:nth-child(11) { animation-delay: 5s; left: 25%; }
.particle:nth-child(12) { animation-delay: 5.5s; left: 35%; }
.particle:nth-child(13) { animation-delay: 6s; left: 45%; }
.particle:nth-child(14) { animation-delay: 6.5s; left: 55%; }
.particle:nth-child(15) { animation-delay: 7s; left: 65%; }
.particle:nth-child(16) { animation-delay: 7.5s; left: 75%; }
.particle:nth-child(17) { animation-delay: 8s; left: 85%; }
.particle:nth-child(18) { animation-delay: 8.5s; left: 95%; }
.particle:nth-child(19) { animation-delay: 9s; left: 5%; }
.particle:nth-child(20) { animation-delay: 9.5s; left: 15%; }

.floating-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.floating-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: floatRandom 8s infinite ease-in-out;
}

.orbiting-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.orbiting-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: orbit 12s infinite linear;
}

@keyframes floatRandom {
  0% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(50px, 30px);
  }
  50% {
    transform: translate(20px, 60px);
  }
  75% {
    transform: translate(-30px, 40px);
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes orbit {
  0% {
    transform: rotate(0deg) translateX(150px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(150px) rotate(-360deg);
  }
}

/* 为浮动圆点设置不同的位置和动画延迟 */
.floating-dot:nth-child(1) { 
  top: 10%; left: 15%; 
  animation-delay: 0s;
  animation-duration: 7s;
}
.floating-dot:nth-child(2) { 
  top: 30%; left: 25%; 
  animation-delay: 1s;
  animation-duration: 8s;
}
.floating-dot:nth-child(3) { 
  top: 50%; left: 35%; 
  animation-delay: 2s;
  animation-duration: 9s;
}
.floating-dot:nth-child(4) { 
  top: 70%; left: 45%; 
  animation-delay: 3s;
  animation-duration: 7s;
}
.floating-dot:nth-child(5) { 
  top: 20%; left: 55%; 
  animation-delay: 4s;
  animation-duration: 8s;
}
.floating-dot:nth-child(6) { 
  top: 40%; left: 65%; 
  animation-delay: 5s;
  animation-duration: 9s;
}
.floating-dot:nth-child(7) { 
  top: 60%; left: 75%; 
  animation-delay: 6s;
  animation-duration: 7s;
}
.floating-dot:nth-child(8) { 
  top: 80%; left: 85%; 
  animation-delay: 7s;
  animation-duration: 8s;
}
.floating-dot:nth-child(9) { 
  top: 15%; left: 95%; 
  animation-delay: 8s;
  animation-duration: 9s;
}
.floating-dot:nth-child(10) { 
  top: 35%; left: 5%; 
  animation-delay: 9s;
  animation-duration: 7s;
}

/* 为轨道圆点设置不同的轨道中心 */
.orbiting-dot:nth-child(1) { 
  top: 20%; left: 20%;
  animation-duration: 10s;
}
.orbiting-dot:nth-child(2) { 
  top: 40%; left: 40%;
  animation-duration: 12s;
}
.orbiting-dot:nth-child(3) { 
  top: 60%; left: 60%;
  animation-duration: 14s;
}
.orbiting-dot:nth-child(4) { 
  top: 80%; left: 80%;
  animation-duration: 16s;
}
.orbiting-dot:nth-child(5) { 
  top: 30%; left: 70%;
  animation-duration: 18s;
}
</style> 