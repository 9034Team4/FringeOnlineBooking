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
      
      <!-- Show login and signup buttons when not authenticated -->
      <template v-if="!isAuthenticated">
        <router-link to="/login" class="login-link">Login</router-link>
        <router-link to="/register" class="signup-btn">Sign Up</router-link>
      </template>
      
      <!-- Show user profile and dropdown menu when authenticated -->
      <div v-else class="user-menu">
        <router-link to="/profile" class="profile-btn" title="Profile">
          <img :src="userAvatar" alt="Profile" class="profile-icon" />
        </router-link>
        <div class="dropdown-menu">
          <router-link to="/profile">Profile</router-link>
          <router-link to="/my-tickets">My Tickets</router-link>
          <router-link to="/orders">Order History</router-link>
          <a href="#" @click.prevent="handleLogout">Logout</a>
        </div>
      </div>
    </nav>
  </header>
</template>

<script>
import { useAuthStore } from '../stores/auth'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'PageHeader',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const userAvatar = computed(() => {
      return authStore.user?.avatar || require('@/assets/icons/profile.svg')
    })
    
    const cartItemCount = computed(() => {
      // TODO: 从 Vuex store 获取购物车商品数量
      return 0
    })
    
    const handleLogout = () => {
      authStore.logout()
      router.push('/')
    }
    
    return {
      isAuthenticated,
      userAvatar,
      cartItemCount,
      handleLogout
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

.user-menu {
  position: relative;
}

.profile-btn {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: transparent;
  transition: background-color 0.2s;
}

.profile-btn:hover {
  background-color: #f5f5f5;
}

.profile-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 150px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 8px 0;
  display: none;
  z-index: 100;
}

.user-menu:hover .dropdown-menu {
  display: block;
}

.dropdown-menu a {
  display: block;
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
}

.dropdown-menu a:hover {
  background-color: #f5f5f5;
}
</style>

