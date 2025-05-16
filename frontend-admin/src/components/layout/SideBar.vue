<template>
  <aside class="sidebar">
    <!-- Logo -->
    <router-link to="/" class="logo">
      <img src="@/assets/images/fringe.png" alt="Adelaide Fringe" />
    </router-link>

    <!-- Navigation -->
    <nav class="nav-links">
      <router-link
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
      >
        <i :class="item.icon"></i>
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'Dashboard', to: '/dashboard', icon: 'fas fa-th-large' },
  { name: 'Events', to: '/events', icon: 'fas fa-calendar' },
  { name: 'Messages', to: '/msg', icon: 'fas fa-paper-plane' },
  { name: 'Staff', to: '/staff', icon: 'fas fa-user' }
]

const isActive = (path) => route.path.startsWith(path)
</script>

<style scoped>
.sidebar {  
  width: 250px;
  height: 100vh;
  flex-shrink: 0;
  background-color: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 40px;
  position: sticky; /* optional */
  top: 0;
  left: 0;
  z-index: 10;
}
.logo {
  height: 70px;
}

.logo img {
  width: 100%;
  height: 100%;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.nav-item {
  width: 200px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  color: #444;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: #f5f5f5;
}

.nav-item.active {
  background-color: #f25c94;
  color: white;
}

.nav-item.active i {
  color: white;
}

.nav-item i {
  font-size: 16px;
  color: #999;
}
</style>
