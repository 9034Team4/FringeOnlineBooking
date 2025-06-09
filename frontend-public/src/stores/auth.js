import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '../api/axiosInstance'

export const useAuthStore = defineStore('auth', () => {
  // Initialize state from localStorage
  const token = ref(localStorage.getItem('token') || null)
  // Try to get cached user data from localStorage
  const cachedUser = localStorage.getItem('user')
  const user = ref(cachedUser ? JSON.parse(cachedUser) : null)
  const isAuthenticated = computed(() => !!token.value)

  // Fetch user profile if token exists (on page refresh or app start)
  if (token.value) {
    fetchUserProfile()
  }

  // Fetch user profile
  async function fetchUserProfile() {
    try {
      const response = await axiosInstance.get('/public/auth/profile')
      if (response.data && response.data.success) {
        setUser(response.data.data)
      } else {
        // Token might be expired if profile fetch fails
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch user profile', error)
      // Keep using cached user data if available, otherwise logout
      if (!user.value) {
        logout()
      }
    }
  }

  function setToken(tokenValue) {
    token.value = tokenValue
    localStorage.setItem('token', tokenValue)
  }

  function setUser(userData) {
    user.value = userData
    // Cache user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function login(email, password) {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password })
      if (response.data && response.data.success) {
        const { token: newToken, user: userData } = response.data.data
        setToken(newToken)
        setUser(userData)
        return { success: true, data: userData }
      }
      return { success: false, message: response.data.message || 'Login failed' }
    } catch (error) {
      console.error('Login request failed', error)
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  async function register(userData) {
    try {
      const response = await axiosInstance.post('/auth/register', userData)
      if (response.data && response.data.success) {
        const { token: newToken, user: newUserData } = response.data.data
        setToken(newToken)
        setUser(newUserData)
        return { success: true, data: newUserData }
      }
      return { success: false, message: response.data.message || 'Registration failed' }
    } catch (error) {
      console.error('Registration request failed', error)
      return { success: false, message: error.response?.data?.message || 'Registration failed' }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout,
    login,
    register,
    fetchUserProfile
  }
}) 