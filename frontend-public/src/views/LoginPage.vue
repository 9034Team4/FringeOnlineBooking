<template>
  <div class="login-container">
    <!-- Left side: Login Form -->
    <div class="login-form">
      <h1 class="brand"><span>ADELAIDE</span> FRINGE</h1>
      <h2>Sign In</h2>

      <form @submit.prevent="handleLogin">
        <label>
          YOUR EMAIL
          <input type="email" v-model="email" placeholder="Enter your email" required />
        </label>

        <label class="password-label">
          PASSWORD
          <span class="forgot" @click="showForgot = true">Forgot your password?</span>
          <input type="password" v-model="password" placeholder="Enter your password" required />
        </label>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </form>

      <div class="or">Or</div>

      <button class="google-btn" @click="googleLogin">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
        Sign in with Google
      </button>
    </div>

    <!-- Right side: Welcome message -->
    <div class="login-welcome">
      <h2>Hello Friend</h2>
      <p>To keep connected with us provide us with your information</p>
      <button class="signup-btn" @click="goToSignup">Signup</button>
    </div>

    <!-- Forgot password modal -->
    <div v-if="showForgot" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <h3>Forgot Password</h3>
          <p>Please contact the administrator to reset your password.</p>
          <button @click="showForgot = false" class="close-btn">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)
const showForgot = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  if (!email.value) {
    errorMsg.value = 'Email is required.'
    return
  }
  if (!password.value) {
    errorMsg.value = 'Password is required.'
    return
  }
  
  isLoading.value = true
  
  try {
    // Use auth store login method
    const result = await authStore.login(email.value, password.value)
    
    if (result.success) {
      // 检查是否有保存的重定向路径
      const redirectPath = localStorage.getItem('redirectAfterLogin')
      
      if (redirectPath) {
        // 清除存储的路径
        localStorage.removeItem('redirectAfterLogin')
        // 重定向到保存的路径
        router.push(redirectPath)
      } else {
        // 如果没有保存的路径，重定向到首页
        router.push('/')
      }
    } else {
      // Show error message if login failed
      errorMsg.value = result.message || 'Login failed.'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMsg.value = 'An unexpected error occurred.'
  } finally {
    isLoading.value = false
  }
}

function googleLogin() {
  window.alert('Google sign in is not available yet.')
}

function goToSignup() {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  display: flex;
  height: 98vh;
  overflow: hidden;
  font-family: 'ABeeZee', sans-serif;
  border-radius: 12px;
  overflow: hidden;
}

.login-form {
  flex: 1;
  padding: 60px;
  background: #f9f9fb;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand {
  font-size: 24px;
  margin-bottom: 20px;
}
.brand span {
  color: #f25c94;
}

h2 {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #555;
}

input {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.password-label {
  position: relative;
}
.forgot {
  position: absolute;
  right: 0;
  top: 0;
  font-weight: normal;
  font-size: 12px;
  color: #888;
  cursor: pointer;
}

.login-btn {
  background: #f25c94;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  margin-top: 10px;
  cursor: pointer;
  width: 100%;
}
.login-btn[disabled] {
  background: #f7a7c4;
  cursor: not-allowed;
}

.or {
  text-align: center;
  margin: 20px 0;
  font-size: 14px;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: white;
  border: 1px solid #ddd;
  padding: 12px;
  width: 100%;
  border-radius: 6px;
  cursor: pointer;
}
.google-btn img {
  width: 18px;
}

.login-welcome {
  flex: 1;
  position: relative;
  background: url('@/assets/images/banner.png');
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
}

/* Dark overlay */
.login-welcome::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8); /* semi-transparent black mask */
  z-index: 1;
}

.login-welcome > * {
  position: relative;
  z-index: 2;
}

.signup-btn {
  margin-top: 20px;
  background: white;
  color: black;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.error-msg {
  color: #e14a82;
  font-size: 13px;
  margin-top: 8px;
  margin-bottom: 8px;
  text-align: left;
}

/* Forgot password modal styles */
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-wrapper {
  box-shadow: 0 2px 8px rgba(0,0,0,0.33);
}
.modal-container {
  background: #fff;
  padding: 30px 40px;
  border-radius: 8px;
  text-align: center;
}
.close-btn {
  margin-top: 20px;
  background: #f25c94;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  cursor: pointer;
}
</style>
