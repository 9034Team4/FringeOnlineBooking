<template>
  <div class="events-page">
    <!-- Event Management Section -->
    <div class="event-mgmt-header">
      <h2>Event Management</h2>
      <div class="categories">
        <span v-for="cat in categories" :key="cat" :class="['category', {active: cat === selectedCategory}]" @click="selectedCategory = cat">{{ cat }}</span>
      </div>
    </div>
    <div class="event-cards">
      <div v-for="(event, idx) in pagedEvents" :key="idx" class="event-card">
        <template v-if="event">
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
        </template>
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
    <!-- 分页按钮 -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Prev</button>
      <button v-for="page in pageCount" :key="page" :class="{ active: currentPage === page }" @click="goToPage(page)">{{ page }}</button>
      <button :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
    ]
  },
  {
    id: 2,
    title: 'Jazz Night',
    author: 'Miles Davis',
    img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    category: 'Music',
    fav: true,
    avatars: [
      'https://randomuser.me/api/portraits/men/50.jpg',
      'https://randomuser.me/api/portraits/women/51.jpg',
      'https://randomuser.me/api/portraits/men/52.jpg',
    ]
  },
  {
    id: 3,
    title: 'Cultural Parade',
    author: 'Li Wei',
    img: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80',
    category: 'Cultural',
    fav: false,
    avatars: [
      'https://randomuser.me/api/portraits/women/60.jpg',
      'https://randomuser.me/api/portraits/men/61.jpg',
    ]
  },
  {
    id: 4,
    title: 'Soccer Finals',
    author: 'Alex Morgan',
    img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80',
    category: 'Sports',
    fav: false,
    avatars: [
      'https://randomuser.me/api/portraits/men/70.jpg',
      'https://randomuser.me/api/portraits/women/71.jpg',
      'https://randomuser.me/api/portraits/men/72.jpg',
    ]
  },
  {
    id: 5,
    title: 'Tech Expo 2025',
    author: 'Sundar Pichai',
    img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80',
    category: 'Technical',
    fav: true,
    avatars: [
      'https://randomuser.me/api/portraits/men/80.jpg',
      'https://randomuser.me/api/portraits/women/81.jpg',
    ]
  },
  {
    id: 6,
    title: 'Street Art Festival',
    author: 'Banksy',
    img: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    category: 'Cultural',
    fav: false,
    avatars: [
      'https://randomuser.me/api/portraits/men/90.jpg',
      'https://randomuser.me/api/portraits/women/91.jpg',
      'https://randomuser.me/api/portraits/men/92.jpg',
    ]
  }
])

const pageSize = 6
const currentPage = ref(1)
const filteredEvents = computed(() => {
  return events.value.filter(e => e.category === selectedCategory.value)
})
const pageCount = computed(() => Math.ceil(filteredEvents.value.length / pageSize))
const pagedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEvents.value.slice(start, start + pageSize)
})
function goToPage(page) {
  if (page >= 1 && page <= pageCount.value) {
    currentPage.value = page
  }
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
  padding: 16px 0 0 0;
  background: #f8f8fa;
  min-height: 100vh;
  font-family: 'ABeeZee', sans-serif;
}
.event-mgmt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  max-width: 1200px;
  margin: 0 auto 10px auto;
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
  display: flex;
  flex-wrap: wrap;
  gap: 28px 28px;
  margin: 0;
  padding: 0 0 24px 40px;
  min-height: 220px;
  align-items: flex-start;
}
.event-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-bottom: 12px;
  position: relative;
  transition: box-shadow 0.2s;
  min-width: 0;
  width: 300px;
  max-width: 300px;
  margin: 0;
}
.event-card:hover {
  box-shadow: 0 8px 32px rgba(242,92,148,0.12);
}
.card-img-wrapper {
  position: relative;
}
.event-img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 18px 18px 0 0;
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
.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 24px 0 0 0;
}
.pagination button {
  border: none;
  background: #f0f0f0;
  color: #333;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
}
.pagination .active {
  background: #16c2b8;
  color: white;
}
</style>