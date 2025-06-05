<template>
  <header class="header">
    <router-link to="/" class="logo">
      <img class="logo" src="@/assets/images/fringe.png" alt="Adelaide Fringe" />
    </router-link>
    <nav class="header-right">
      <router-link to="/cart" class="cart-btn">
        <img src="../assets/icons/cart.svg" alt="Cart" class="cart-icon" />
        <span class="cart-count" v-if="cartItemCount > 0">{{ cartItemCount }}</span>
      </router-link>
      <router-link to="/auth" class="login-link">Login</router-link>
      <router-link to="/register" class="signup-btn">Sign Up</router-link>
      <router-link to="/profile" class="profile-btn" title="Profile">
        <img src="@/assets/icons/profile.svg" alt="Profile" class="profile-icon" />
      </router-link>
    </nav>
  </header>
</template>

<script>
export default {
  name: 'PageHeader',
  computed: {
    cartItemCount() {
      // TODO: 从 Vuex store 获取购物车商品数量
      return 0
    }
  }
}
</script>

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

.cart-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 6px;
  background: transparent;
  transition: background-color 0.2s;
}

.cart-btn:hover {
  background-color: #f5f5f5;
}

.cart-icon {
  width: 24px;
  height: 24px;
}

.cart-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #f25c94;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.profile-btn {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: transparent;
  transition: background-color 0.2s;
  margin-left: 8px;
}

.profile-btn:hover {
  background-color: #f5f5f5;
}

.profile-icon {
  width: 28px;
  height: 28px;
}
</style>

