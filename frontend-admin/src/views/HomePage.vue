<template>
  <AppLayout>
    <div class="home-page">
      <h1>Welcome to the Admin Portal</h1>
      <p class="subtitle">Manage your events, staff, and bookings efficiently.</p>
      <div class="quick-links">
        <router-link to="/dashboard" class="quick-btn">Go to Dashboard</router-link>
        <router-link to="/events" class="quick-btn">Manage Events</router-link>
        <router-link to="/staff" class="quick-btn">View Staff</router-link>
        <router-link to="/msg" class="quick-btn">Messages</router-link>
      </div>
      <div class="announcements">
        <h2>Announcements</h2>
        <ul>
          <li v-for="item in announcements" :key="item.id">
            <span class="date">{{ item.date }}</span>
            <span class="content">{{ item.content }}</span>
          </li>
        </ul>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/components/AppLayout.vue'
import { ref } from 'vue'

const announcements = ref([
  { id: 1, date: '2024-07-01', content: 'System maintenance scheduled for August 1st.' },
  { id: 2, date: '2024-07-02', content: 'New event management features released.' },
  { id: 3, date: '2024-07-03', content: 'Welcome new staff members to the team!' },
])
</script>

<style scoped>
.home-page {
  padding: 40px 32px;
  font-family: 'ABeeZee', sans-serif;
}
h1 {
  font-size: 32px;
  margin-bottom: 8px;
}
.subtitle {
  color: #888;
  margin-bottom: 32px;
}
.quick-links {
  display: flex;
  gap: 18px;
  margin-bottom: 40px;
}
.quick-btn {
  background: #16c2b8;
  color: white;
  border-radius: 6px;
  padding: 12px 28px;
  text-decoration: none;
  font-weight: bold;
  font-size: 16px;
  transition: background 0.2s;
}
.quick-btn:hover {
  background: #139a91;
}
.announcements {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  max-width: 600px;
}
.announcements h2 {
  margin-bottom: 16px;
}
.announcements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.announcements li {
  margin-bottom: 12px;
  font-size: 15px;
  display: flex;
  gap: 16px;
  align-items: center;
}
.date {
  color: #16c2b8;
  font-weight: bold;
  min-width: 100px;
}
.content {
  color: #333;
}
</style>