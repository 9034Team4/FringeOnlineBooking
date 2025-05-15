<template>
  <div class="events-page">
    <!-- Banner Section -->
    <div class="banner-section">
      <div class="banner-header">
        <span>Banner</span>
        <button class="change-banner-btn" @click="changeBanner">Change Banner</button>
      </div>
      <img class="banner-img" src="@/assets/images/banner.png" alt="Banner" />
    </div>

    <!-- Event Management Section -->
    <div class="event-mgmt-header">
      <h2>Event Management</h2>
      <div class="categories">
        <span v-for="cat in categories" :key="cat" :class="['category', {active: cat === selectedCategory}]" @click="selectedCategory = cat">{{ cat }}</span>
      </div>
    </div>
    <div class="event-cards">
      <div v-for="event in filteredEvents" :key="event.id" class="event-card">
        <div class="card-img-wrapper">
          <img :src="event.img" class="event-img" alt="event" />
          <button class="fav-btn" @click="toggleFav(event)"><i :class="event.fav ? 'fas fa-heart' : 'far fa-heart'"></i></button>
        </div>
        <div class="card-content">
          <div class="event-title">{{ event.title }}</div>
          <div class="event-author">By {{ event.author }}</div>
          <div class="avatars">
            <template v-for="(avatar, idx) in event.avatars.slice(0, 4)" :key="idx">
              <img :src="avatar" class="avatar" />
            </template>
            <span v-if="event.avatars.length > 4" class="more-avatar">+{{ event.avatars.length - 4 }}</span>
          </div>
          <div class="card-actions">
            <span class="current-data">Current Data</span>
            <button class="delete-btn" @click="deleteEvent(event)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Banner Modal -->
    <div v-if="showBannerModal" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <h3>Change Banner</h3>
          <p>This is a static demo. Banner upload is not available.</p>
          <button class="close-btn" @click="showBannerModal = false">Close</button>
        </div>
      </div>
    </div>
    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <h3>Delete Event</h3>
          <p>Are you sure you want to delete <b>{{ deleteTarget?.title }}</b>?</p>
          <button class="delete-btn" @click="confirmDelete">Delete</button>
          <button class="close-btn" @click="showDeleteModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const showBannerModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const categories = ['Technical', 'Music', 'Cultural', 'Sports']
const selectedCategory = ref('Technical')

const events = ref([
  {
    id: 1,
    title: 'Abstract Colors',
    author: 'Esthera Jackson',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    category: 'Technical',
    fav: false,
    avatars: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
      'https://randomuser.me/api/portraits/women/46.jpg',
      'https://randomuser.me/api/portraits/men/47.jpg'
    ]
  },
  {
    id: 2,
    title: 'Abstract Colors',
    author: 'Esthera Jackson',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    category: 'Music',
    fav: true,
    avatars: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
      'https://randomuser.me/api/portraits/women/46.jpg'
    ]
  },
  {
    id: 3,
    title: 'Abstract Colors',
    author: 'Esthera Jackson',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    category: 'Cultural',
    fav: false,
    avatars: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
      'https://randomuser.me/api/portraits/women/46.jpg',
      'https://randomuser.me/api/portraits/men/47.jpg',
      'https://randomuser.me/api/portraits/women/48.jpg'
    ]
  },
  {
    id: 4,
    title: 'Abstract Colors',
    author: 'Esthera Jackson',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    category: 'Sports',
    fav: false,
    avatars: [
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/men/45.jpg',
      'https://randomuser.me/api/portraits/women/46.jpg'
    ]
  }
])

const filteredEvents = computed(() => {
  return events.value.filter(e => e.category === selectedCategory.value)
})

function changeBanner() {
  showBannerModal.value = true
}
function toggleFav(event) {
  event.fav = !event.fav
}
function deleteEvent(event) {
  deleteTarget.value = event
  showDeleteModal.value = true
}
function confirmDelete() {
  showDeleteModal.value = false
}
</script>

<style scoped>
.events-page {
  padding: 40px 0 0 0;
  background: #f8f8fa;
  min-height: 100vh;
  font-family: 'ABeeZee', sans-serif;
}
.banner-section {
  background: #fff;
  border-radius: 18px;
  padding: 32px 40px 32px 40px;
  margin: 0 auto 36px auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  max-width: 900px;
}
.banner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 20px;
  font-weight: bold;
}
.change-banner-btn {
  background: #f25c94;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 32px;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(242,92,148,0.08);
}
.banner-img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.event-mgmt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1200px;
  margin: 0 auto 18px auto;
  padding: 0 20px;
}
.event-mgmt-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}
.categories {
  display: flex;
  gap: 32px;
  font-size: 15px;
  font-weight: 400;
}
.category {
  color: #bdbdbd;
  font-weight: 400;
  cursor: pointer;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border 0.2s;
}
.category.active {
  color: #7c4dff;
  border-bottom: 2px solid #7c4dff;
}
.event-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px 20px;
}
.event-card {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 18px;
  position: relative;
  transition: box-shadow 0.2s;
}
.event-card:hover {
  box-shadow: 0 8px 32px rgba(242,92,148,0.12);
}
.card-img-wrapper {
  position: relative;
}
.event-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 24px 24px 0 0;
}
.fav-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(242,92,148,0.10);
  cursor: pointer;
  font-size: 20px;
  color: #f25c94;
  transition: background 0.2s;
}
.fav-btn .fa-heart {
  color: #f25c94;
}
.card-content {
  padding: 18px 22px 0 22px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.event-title {
  font-size: 18px;
  font-weight: bold;
}
.event-author {
  font-size: 14px;
  color: #888;
  margin-bottom: 4px;
}
.avatars {
  display: flex;
  align-items: center;
  margin: 8px 0 0 0;
  height: 32px;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  margin-left: -10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  background: #eee;
  z-index: 1;
}
.avatars .avatar:first-child {
  margin-left: 0;
}
.more-avatar {
  margin-left: 10px;
  font-size: 13px;
  color: #888;
}
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.current-data {
  color: #1976d2;
  font-size: 14px;
  font-weight: bold;
  background: #e3f2fd;
  border-radius: 8px;
  padding: 4px 14px;
}
.delete-btn {
  background: #283593;
  color: white;
  border: none;
  border-radius: 18px;
  padding: 7px 28px;
  font-size: 15px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(40,53,147,0.08);
  transition: background 0.2s;
}
.delete-btn:hover {
  background: #1a237e;
}
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
  border-radius: 12px;
  text-align: center;
  min-width: 320px;
}
.close-btn {
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-size: 15px;
  cursor: pointer;
  margin-left: 16px;
}
</style>