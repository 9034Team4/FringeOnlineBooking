<template>
  <div>
    <section class="event-filters">
      <!-- Title -->
      <h2 class="title">
        Upcoming <span class="highlight">Events</span>
      </h2>

      <!-- Dropdown Filters -->
      <div class="filters">
        <select v-model="selectedWeekday" @change="filterEvents">
          <option value="">All Weekdays</option>
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
          <option>Saturday</option>
          <option>Sunday</option>
        </select>

        <select v-model="selectedType" @change="filterEvents">
          <option value="">All Event Types</option>
          <option v-for="type in eventTypes" :key="type">{{ type }}</option>
        </select>

        <select v-model="selectedCategory" @change="filterEvents">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
      </div>    
    </section>
    
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading events...</p>
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchEvents" class="retry-btn">Retry</button>
    </div>
    
    <!-- Events Grid -->
    <div v-else class="event-container">
      <div v-if="displayedEvents.length === 0" class="no-events">
        <p>No events match your filters. Try changing your selection.</p>
      </div>
      <EventCard
        v-for="event in displayedEvents"
        :key="event.id"
        :id="event.id"
        :title="event.name"
        :image="getImageUrl(event.imageUrl) || event.venue?.imageUrl || '/images/event-placeholder.jpg'"
        :date="formatDate(event.startTime)"
        :location="event.venue?.name || 'TBA'"
        :price="formatPrice(event.basePrice)"
        :category="event.category?.name"
        :tags="[]"
      />    
    </div>
    
    <!-- Load More Button -->
    <div class="load-more-wrapper" v-if="hasMoreEvents">
      <button class="load-more-btn" @click="loadMore" :disabled="isLoadingMore">
        <span v-if="isLoadingMore">Loading...</span>
        <span v-else>Load more...</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { events } from '@/api/publicApi'
import EventCard from '@/components/EventCard.vue'

// State variables
const allEvents = ref([])
const displayedEvents = ref([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const error = ref(null)
const page = ref(1)
const limit = ref(8)
const totalEvents = ref(0)
const hasMoreEvents = computed(() => displayedEvents.value.length < totalEvents.value)

// Filter state
const selectedWeekday = ref('')
const selectedType = ref('')
const selectedCategory = ref('')
const eventTypes = ref(['Music', 'Comedy', 'Workshop', 'Theatre', 'Art', 'Dance', 'Festival'])
const categories = ref(['Kids', 'Adults', 'Family', 'Seniors', 'Students'])

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return 'Date TBA'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
}

// Format price function
const formatPrice = (price) => {
  if (!price || price === '0.00') return 'Free'
  
  const numericPrice = parseFloat(price)
  return numericPrice === 0 ? 'Free' : `$${numericPrice.toFixed(2)}`
}

// Get image URL function
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  try {
    // For image filenames that are stored in the local assets folder
    if (imageUrl.startsWith('event-')) {
      return `/images/${imageUrl}`
    }
    // For full URLs (like venue images)
    return imageUrl
  } catch (err) {
    console.error('Error loading image:', err)
    return null
  }
}

// Fetch events from API
const fetchEvents = async (resetPage = true) => {
  if (resetPage) {
    page.value = 1
    isLoading.value = true
    error.value = null
  } else {
    isLoadingMore.value = true
  }
  
  try {
    // Prepare query parameters
    const params = {
      page: page.value,
      limit: limit.value
    }
    
    // Add filters if selected
    if (selectedWeekday.value) params.weekday = selectedWeekday.value
    if (selectedType.value) params.type = selectedType.value
    if (selectedCategory.value) params.category = selectedCategory.value
    
    // Call API
    console.log('Fetching events with params:', params)
    const response = await events.list(params)
    console.log('API response:', response)
    
    if (response.data && response.data.success) {
      const eventData = response.data.data.items || []
      const pagination = response.data.data.pagination || {}
      
      if (resetPage) {
        allEvents.value = eventData
        displayedEvents.value = eventData
      } else {
        // Append new events
        allEvents.value = [...allEvents.value, ...eventData]
        displayedEvents.value = [...displayedEvents.value, ...eventData]
      }
      
      totalEvents.value = pagination.total || eventData.length
    } else {
      error.value = response.data?.message || 'Failed to load events'
    }
  } catch (err) {
    console.error('Error fetching events:', err)
    error.value = 'Unable to load events. Please try again later.'
    
    // Fallback to mock data if API fails
    if (resetPage) {
      import('@/mocks/events').then(module => {
        allEvents.value = module.default
        displayedEvents.value = module.default.slice(0, limit.value)
        totalEvents.value = module.default.length
        error.value = 'Using mock data - API connection failed'
      })
    }
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// Load more events
const loadMore = async () => {
  page.value += 1
  await fetchEvents(false)
}

// Filter events
const filterEvents = () => {
  fetchEvents(true)
}

// Initialize component
onMounted(() => {
  fetchEvents()
})
</script>

<style scoped>
.event-filters {
  user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 32px;
  font-weight: bold;
  color: #111;
  margin: 0;
}

.highlight {
  color: #f25c94;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filters select {
  user-select: none;
  padding: 10px 14px;
  border-radius: 8px;
  width: 140px;
  border: none;
  background-color: #f3f3f3;
  font-size: 14px;
  color: #333;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg width='14' height='10' viewBox='0 0 14 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L7 8L13 1' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
  cursor: pointer;
}

.event-container {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin: 0 auto;
  padding: 20px 0;
}

.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  user-select: none;
}

.load-more-btn {
  background-color: #f25c94;
  color: white;
  font-size: 14px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.load-more-btn:hover {
  background-color: #e14a82;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f25c94;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 40px 0;
  color: #e14a82;
}

.retry-btn {
  background-color: #f25c94;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.no-events {
  text-align: center;
  grid-column: 1 / -1;
  padding: 40px 0;
  color: #666;
}
</style>
