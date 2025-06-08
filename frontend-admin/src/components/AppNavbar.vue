<template>
  <div class="navbar">
    <div class="navbar-brand">
      <span class="brand-text">Fringe Admin</span>
    </div>
    <div class="navbar-menu">
      <router-link to="/dashboard" class="navbar-item" :class="{ active: isActive('dashboard') }">
        <i class="bi bi-speedometer2"></i>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/events" class="navbar-item" :class="{ active: isActive('events') }">
        <i class="bi bi-calendar-event"></i>
        <span>Events</span>
      </router-link>
      <router-link to="/seats" class="navbar-item" :class="{ active: isActive('seat-management') }">
        <i class="bi bi-grid-3x3"></i>
        <span>座位管理</span>
      </router-link>
      <router-link to="/msg" class="navbar-item" :class="{ active: isActive('msg') }">
        <i class="bi bi-chat-dots"></i>
        <span>Messages</span>
      </router-link>
      <router-link to="/staff" class="navbar-item" :class="{ active: isActive('staff') }">
        <i class="bi bi-people"></i>
        <span>Staff</span>
      </router-link>
    </div>
    <div class="navbar-footer">
      <div class="user-info">
        <img src="https://via.placeholder.com/40" alt="User" class="user-avatar">
        <div class="user-details">
          <span class="user-name">Admin User</span>
          <span class="user-role">Administrator</span>
        </div>
      </div>
      <button class="logout-button" @click="logout">
        <i class="bi bi-box-arrow-right"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    logout() {
      // Implement the logout logic here
    },
    isActive(route) {
      return this.$route.path.includes(route);
    }
  }
};
</script> 