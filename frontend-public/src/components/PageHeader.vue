<template>
  <header class="header">
    <router-link to="/" class="logo">
      <img class="logo" src="@/assets/images/fringe.png" alt="Adelaide Fringe" />
    </router-link>
    <nav class="header-right">
      <a href="#">Accessibility</a>
      <router-link to="/auth" class="login-link">Login</router-link>
      <router-link to="/auth" class="signup-btn">Sign Up</router-link>
    </nav>
  </header>
</template>

<style scoped>
.header {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.header-right a,
.header-right .login-link {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  font-size: 16px;
}

.signup-btn {
  background-color: #f25c94;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  width: 130px;
  height: 50px;
  cursor: pointer;
  font-size: 16px;
  user-select: none;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  text-decoration: none;
}

.signup-btn:hover {
  background-color: #e14a82;
}

.logo {
  height: 100%;
}
</style>

