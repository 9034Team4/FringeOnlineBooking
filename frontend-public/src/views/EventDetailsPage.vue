<template>
  <div class="event-details-container">
    <div v-if="loading" class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Loading event information...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <div class="alert alert-danger">
        {{ error }}
      </div>
    </div>
    
    <div v-else>
      <div class="event-header">
        <img :src="event.coverImage || '/images/event-placeholder.jpg'" alt="Event Banner" class="event-banner" />
        <div class="event-header-info">
          <h1>{{ event.name || event.title }}</h1>
          <div class="event-info-box">
            <p class="event-datetime">{{ formatDate(event.startDate) }}</p>
            <button class="book-btn" @click="goToSeatSelection">Book Tickets</button>
            <button class="secondary-btn" style="margin-left: 5px;" @click="goToVenue">Venue Info</button>
            <p class="refund-info">{{ event.refundPolicy || 'No refunds available' }}</p>
          </div>
        </div>
      </div>

      <div class="event-content">
        <div class="left-column">
          <h2>{{ event.venue?.name }}</h2>
          <p class="description">
            {{ event.shortDescription }}
          </p>

          <h3>Event Details</h3>
          <div v-html="event.description"></div>

          <h3>Event Time</h3>
          <p>Start Time: <strong>{{ formatTime(event.startDate) }}</strong></p>
          <p>End Time: <strong>{{ formatTime(event.endDate) }}</strong></p>

          <h3>Organizer Contact</h3>
          <p>{{ event.organizerContact || 'Please visit the event website for more information' }}</p>
        </div>

        <div class="right-column">
          <h3>Event Location</h3>
          <GMapMap
            :center="mapCenter"
            :zoom="14"
            style="width: 100%; height: 300px"
          >
            <GMapMarker :position="mapCenter" />
          </GMapMap>
          <p><strong>{{ event.venue?.name }}</strong></p>
          <p>{{ event.venue?.address }}</p>

          <h3>Ticket Prices</h3>
          <div class="ticket-prices">
            <div v-for="(price, type) in event.ticketPrices" :key="type" class="ticket-price-item">
              <span class="ticket-type">{{ type }}</span>
              <span class="ticket-price">${{ price.toFixed(2) }}</span>
            </div>
          </div>

          <h3>Tags</h3>
          <div class="tags">
            <span v-for="tag in event.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <h3>Share with Friends</h3>
          <div class="social-icons">
            <a href="#" @click.prevent="shareEvent('facebook')"><i class="bi bi-facebook"></i></a>
            <a href="#" @click.prevent="shareEvent('twitter')"><i class="bi bi-twitter"></i></a>
            <a href="#" @click.prevent="shareEvent('whatsapp')"><i class="bi bi-whatsapp"></i></a>
            <a href="#" @click.prevent="shareEvent('linkedin')"><i class="bi bi-linkedin"></i></a>
          </div>
        </div>
      </div>

      <div class="related-events">
        <h2>You Might Also Like</h2>
        <Upcoming/>
      </div>
    </div>
  </div>
</template>

<script>
import Upcoming from '@/components/UpcomingEventFilters.vue'
import { Map as GMapMap, Marker as GMapMarker } from '@fawmi/vue-google-maps'
import axiosInstance from '@/api/axiosInstance'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'EventDetailsPage',
  components: {
    Upcoming,
    GMapMap,
    GMapMarker
  },
  setup() {
    const event = ref({
      title: '',
      description: '',
      shortDescription: '',
      startDate: null,
      endDate: null,
      venue: null,
      coverImage: '',
      organizerContact: '',
      ticketPrices: {},
      tags: [],
      refundPolicy: ''
    })
    const loading = ref(true)
    const error = ref(null)
    const router = useRouter()

    const mapCenter = computed(() => {
      // 如果有场馆信息且有经纬度，则使用场馆的位置
      if (event.value.venue) {
        // 尝试从venue中获取经纬度
        if (event.value.venue.latitude && event.value.venue.longitude) {
          return {
            lat: parseFloat(event.value.venue.latitude),
            lng: parseFloat(event.value.venue.longitude)
          }
        }
        
        // 如果没有经纬度但有位置信息，可以使用位置名称
        // 这里我们使用阿德莱德的不同场馆的实际坐标
        const venueLocations = {
          'Adelaide Festival Centre': { lat: -34.9206, lng: 138.5995 },
          'Adelaide Convention Centre': { lat: -34.9207, lng: 138.5942 },
          'The Garden of Unearthly Delights': { lat: -34.9210, lng: 138.6107 },
          'Gluttony': { lat: -34.9187, lng: 138.6123 },
          'Adelaide Town Hall': { lat: -34.9281, lng: 138.6006 }
        }
        
        // 如果能在预定义地点中找到场馆，使用其坐标
        if (event.value.venue.name && venueLocations[event.value.venue.name]) {
          return venueLocations[event.value.venue.name]
        }
        
        // 如果有位置信息但没有坐标，可以使用位置名称的默认坐标
        if (event.value.venue.location) {
          console.log('Using venue location:', event.value.venue.location)
          // 这里可以添加更多位置的映射
        }
      }
      
      // 默认返回阿德莱德市中心坐标
      return { lat: -34.9285, lng: 138.6007 }
    })

    const fetchEventDetails = async () => {
      // 从路由参数中获取事件ID
      const eventId = router.currentRoute.value.params.id
      
      if (!eventId) {
        error.value = 'Event ID not found'
        loading.value = false
        return
      }
      
      try {
        loading.value = true
        console.log(`Fetching event details for ID: ${eventId}`)
        const response = await axiosInstance.get(`/public/events/${eventId}`)
        
        if (response.data.success) {
          console.log('Event data received:', response.data.data)
          event.value = response.data.data
          
          // 处理图片URL
          if (event.value.imageUrl) {
            event.value.coverImage = `/images/${event.value.imageUrl}`
          } else if (event.value.venue?.imageUrl) {
            event.value.coverImage = event.value.venue.imageUrl
          }
          
          // 处理日期
          event.value.startDate = event.value.startTime
          event.value.endDate = event.value.endTime
          
          // 处理描述
          if (!event.value.shortDescription) {
            event.value.shortDescription = event.value.description.substring(0, 150) + '...'
          }
          
          // 处理票价
          if (!event.value.ticketPrices) {
            event.value.ticketPrices = {
              'Standard': parseFloat(event.value.basePrice) || 0
            }
            
            // 如果有座位计划，添加VIP票价
            if (event.value.seatingPlan && event.value.seatingPlan.sections) {
              const vipSection = event.value.seatingPlan.sections.find(s => s.name === 'VIP')
              if (vipSection && vipSection.rows && vipSection.rows.length > 0 && 
                  vipSection.rows[0].seats && vipSection.rows[0].seats.length > 0) {
                event.value.ticketPrices['VIP'] = vipSection.rows[0].seats[0].price
              }
            }
          }
          
          // 处理标签
          if (!event.value.tags || event.value.tags.length === 0) {
            event.value.tags = [event.value.category?.name || 'Event']
          }
          
        } else {
          error.value = response.data.message || 'Failed to load event details'
        }
      } catch (err) {
        console.error('Error fetching event:', err)
        error.value = err.message || 'Failed to load event details'
      } finally {
        loading.value = false
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    }

    const formatTime = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const shareEvent = (platform) => {
      const url = window.location.href
      const title = event.value.title
      
      let shareUrl = ''
      
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
          break
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
          break
        case 'whatsapp':
          shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`
          break
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
          break
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }
    }

    onMounted(() => {
      fetchEventDetails()
    })

    return {
      event,
      loading,
      error,
      mapCenter,
      formatDate,
      formatTime,
      shareEvent
    }
  },
  methods: {
    // Navigate to seat selection page
    goToSeatSelection() {
      const eventId = this.$route.params.id
      this.$router.push(`/events/${eventId}/seats`)
    },
    // Navigate to venue details page
    goToVenue() {
      if (this.event.venue) {
        this.$router.push(`/venue/${this.event.venue.id}`)
      } else {
        this.$router.push('/venue')
      }
    }
  }
}
</script>


<style scoped>
.event-details-container {
  padding: 20px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.event-header {
  display: flex;
  position: relative;
  margin-bottom: 30px;
}

.event-banner {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

.event-header-info {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  max-width: 300px;
}

.event-datetime {
  margin-bottom: 10px;
  font-weight: bold;
}

.book-btn {
  background: #f25c94;
  color: white;
  border: none;
  padding: 10px 20px;
  margin-bottom: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.book-btn:hover {
  background: #d7407c;
}

.secondary-btn {
  background: #f5f5f5;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.secondary-btn:hover {
  background: #e0e0e0;
}

.refund-info {
  font-size: 12px;
  color: #666;
}

.event-content {
  display: flex;
  gap: 40px;
}

.left-column, .right-column {
  flex: 1;
}

h2, h3 {
  margin-top: 20px;
  margin-bottom: 15px;
}

.ticket-prices {
  margin-bottom: 20px;
}

.ticket-price-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.ticket-price {
  font-weight: bold;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tag {
  background: #eee;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.social-icons {
  display: flex;
  gap: 15px;
}

.social-icons a {
  font-size: 24px;
  color: #666;
  transition: color 0.3s;
}

.social-icons a:hover {
  color: #f25c94;
}

.related-events {
  margin-top: 60px;
}

@media (max-width: 768px) {
  .event-content {
    flex-direction: column;
  }
  
  .event-header-info {
    position: relative;
    bottom: auto;
    right: auto;
    max-width: 100%;
    margin-top: 20px;
  }
  
  .event-banner {
    height: 250px;
  }
}
</style>