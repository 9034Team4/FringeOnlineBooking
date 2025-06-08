import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const isAuthenticated = computed(() => !!user.value)

  function setUser(userData) {
    user.value = userData
  }

  function setToken(tokenValue) {
    token.value = tokenValue
  }

  function logout() {
    user.value = null
    token.value = null
  }

  async function login(email, password) {
    // 模拟API调用
    const response = await fakeAuth(email, password)
    setUser(response.user)
    setToken(response.token)
    return response
  }

  async function register(userData) {
    // 模拟API调用
    const response = await fakeRegister(userData)
    setUser(response.user)
    setToken(response.token)
    return response
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout,
    login,
    register
  }
})

// 临时模拟函数
async function fakeAuth(email, _password) {
  console.log(_password)
  return {
    user: { email, name: 'Test User' },
    token: 'fake-jwt-token'
  }
}

async function fakeRegister(userData) {
  return {
    user: userData,
    token: 'fake-jwt-token'
  }
} 