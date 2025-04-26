import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const isAuthenticated = ref(!!token.value)

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/auth/login', credentials)
      const { message } = response.data
      
      // 保存token和用户信息
      token.value = response.headers['authorization']?.split(' ')[1] || ''
      user.value = { phone: credentials.phone }
      isAuthenticated.value = true
      
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      return { message }
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', {
        phone: userData.phone,
        password: userData.password,
        nickname: userData.nickname
      })
      return response.data
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      // 无论登出请求是否成功，都清除本地状态
      token.value = ''
      user.value = null
      isAuthenticated.value = false
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      delete axios.defaults.headers.common['Authorization']
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout
  }
}) 