<template>
  <header class="topbar">
    <!-- Optional Title -->
    <div class="topbar-left">
      <h2 v-if="isDashboard" class="page-title">Dashboard</h2>
    </div>

    <!-- Right Section: Avatar -->
    <div class="topbar-right">
      <!-- Notification or other icons can go here -->
      <img class="avatar" src="@/assets/images/user-avatar.jpg" alt="User Avatar" />
    </div>
  </header>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
const isDashboard = route.path === '/dashboard'
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
  z-index: 10;
  position: sticky;
  top: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}
</style>
