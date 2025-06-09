<template>
  <div class="auth-container">
    <div class="form-container" :class="{ 'sign-up-mode': isSignUp }">
      <!-- Sign In Form -->
      <div class="sign-in-form">
        <h2>Sign In</h2>
        <form @submit.prevent="handleSignIn">
          <label for="email">Your Email</label>
          <input type="email" id="email" placeholder="Enter your mail" required />

          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Enter your password" required />

          <a href="#" class="forgot">Forgot your password?</a>
          <button type="submit" class="btn solid">Sign In</button>
        </form>
      </div>

      <!-- Sign Up Form  -->
      <div class="sign-up-form">
        <h2>Sign Up</h2>
        <form @submit.prevent="handleSignUp">
          <label for="name">Your Name</label>
          <input type="text" id="name" placeholder="Enter your name" required />

          <label for="password">Password</label>
          <input type="password" placeholder="Enter your password" required />

          <label for="confirm">Confirm Password</label>
          <input type="password" placeholder="Enter your password" required />

          <button type="submit" class="btn solid">Sign Up</button>
        </form>
      </div>

      <!-- Overlay Section -->
      <div class="overlay-container">
        <div class="overlay">
          <div v-if="!isSignUp" class="overlay-panel right-panel">
            <h2>Hello Friend</h2>
            <p>To keep connected with us provide us with your information</p>
            <button class="ghost" @click="toggleMode">Signup</button>
          </div>
          <div v-else class="overlay-panel left-panel">
            <h2>Welcome back</h2>
            <p>To keep connected with us provide us with your information</p>
            <button class="ghost" @click="toggleMode">Signin</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "AuthPage",
  data() {
    return {
      isSignUp: false,
    };
  },
  methods: {
    // Toggle between sign-in and sign-up views
    toggleMode() {
      this.isSignUp = !this.isSignUp;
    },
    // Handle sign-up and switch to sign-in
    handleSignUp() {
      this.isSignUp = false;
    },
    // Handle sign-in and redirect to home page
    handleSignIn() {
      this.$router.push('/');
    }
  },
};
</script>

<style scoped>
.auth-container {
  background: url('@/assets/images/Rectangle 3.png') no-repeat center;
  background-size: cover;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-container {
  background: #fff;
  display: flex;
  width: 70vw;
  max-width: 1000px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  position: relative;
}

.sign-in-form,
.sign-up-form {
  width: 50%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.sign-up-form {
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.5s ease;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
}

.form-container.sign-up-mode .sign-in-form {
  transform: translateX(-100%);
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
}

.form-container.sign-up-mode .sign-up-form {
  transform: translateX(0);
  opacity: 1;
  position: relative;
}

label {
  font-weight: 600;
  margin-top: 15px;
  margin-bottom: 5px;
  font-size: 14px;
}

input {
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: 100%;
}

button.btn.solid {
  background-color: #f6628c;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  cursor: pointer;
}

button.ghost {
  background-color: white;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.overlay-container {
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: transparent;
  overflow: hidden;
}

.overlay {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  padding: 40px;
  width: 100%;
  height: 100%;
}

.overlay-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

p {
  font-size: 14px;
  margin-bottom: 20px;
}

.forgot {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: -10px;
  margin-bottom: 10px;
  display: block;
}
</style>

