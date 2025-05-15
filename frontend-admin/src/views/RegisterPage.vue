<template>
  <div class="auth-container">
    <!-- Left side welcome -->
    <div class="auth-welcome">
      <div class="overlay">
        <h2>Welcome back</h2>
        <p>To keep connected with us provide us with your information</p>
        <router-link to="/login">
          <button class="white-btn">Signin</button>
        </router-link>
      </div>
    </div>

    <!-- Right side form -->
    <div class="auth-form">
      <h1>
        <span class="highlight">ADELAIDE</span> FRINGE
      </h1>
      <h2>Sign Up</h2>

      <form @submit.prevent="submit">
        <label>YOUR EMAIL</label>
        <input v-model="email" type="email" placeholder="Enter your email" required />
        <div v-if="errorEmail" class="error-msg">{{ errorEmail }}</div>

        <label>PASSWORD</label>
        <input v-model="password" type="password" placeholder="Enter your password" required />

        <label>CONFIRM PASSWORD</label>
        <input v-model="confirmPassword" type="password" placeholder="Enter your password" required />
        <div v-if="errorPassword" class="error-msg">{{ errorPassword }}</div>

        <button type="submit" class="pink-btn" :disabled="isLoading">
          <span v-if="isLoading">Signing up...</span>
          <span v-else>Sign Up</span>
        </button>
        <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
      </form>

      <div class="divider">Or</div>

      <button class="google-btn" @click="googleSignUp">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
        Sign up with Google
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorEmail = ref('')
const errorPassword = ref('')
const successMsg = ref('')
const isLoading = ref(false)
const router = useRouter()

function validateEmail(val) {
  // Simple email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

const submit = () => {
  errorEmail.value = ''
  errorPassword.value = ''
  successMsg.value = ''

  if (!email.value.trim()) {
    errorEmail.value = 'Email is required.'
    return
  }
  if (!validateEmail(email.value)) {
    errorEmail.value = 'Please enter a valid email address.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorPassword.value = 'Passwords do not match.'
    return
  }
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    successMsg.value = 'Sign up successful! Redirecting to login page in 3 seconds...'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }, 1500)
}

function googleSignUp() {
  window.alert('Google sign up is not available yet.')
}
</script>

<style scoped>
.auth-container {
  display: flex;
  min-height: 100vh;
  font-family: 'ABeeZee', sans-serif;
}

/* Left panel */
.auth-welcome {
  flex: 1;
  user-select: none;
  background: url('@/assets/images/banner.png');
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.auth-welcome .overlay {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 300px;
}

.auth-welcome::before {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
}

/* Right form */
.auth-form {
  flex: 1;
  background-color: #f9f9f9;
  justify-content: center;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.auth-form h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.auth-form .highlight {
  color: #f25c94;
}

.auth-form h2 {
  font-size: 24px;
  margin-bottom: 30px;
}

.auth-form form {
  display: flex;
  flex-direction: column;
  width: 580px;
}

.auth-form label {
  font-size: 13px;
  margin-top: 16px;
  margin-bottom: 4px;
  color: #333;
}

.auth-form input {
  display: block;
  padding: 12px;
  margin-top: 6px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.pink-btn {
  background-color: #f25c94;
  display: block;
  color: white;
  width: 100%;
  padding: 12px;
  margin-top: 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.pink-btn[disabled] {
  background-color: #f7a7c4;
  cursor: not-allowed;
}

.pink-btn:hover {
  background-color: #e14a82;
}

.white-btn {
  background: white;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  margin-top: 20px;
  cursor: pointer;
}

.divider {
  margin: 24px 0;
  color: #888;
}

.google-btn {
  border: 1px solid #ccc;
  background: white;
  display: flex;
  width: 580px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.google-btn img {
  width: 20px;
  height: 20px;
}

.error-msg {
  color: #e14a82;
  font-size: 13px;
  margin-top: 4px;
}
.success-msg {
  color: #2ecc40;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}
</style>
