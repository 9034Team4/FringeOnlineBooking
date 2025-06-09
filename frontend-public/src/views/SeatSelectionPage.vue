<template>
  <div class="seat-selection-page">
    <PageHeader title="Select Seats" subtitle="Please select the seats you want to book" />
    
    <div class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <div class="row">
            <div class="col-md-4">
              <div class="event-info card">
                <img 
                  :src="`/images/${event?.imageUrl}` || 'https://via.placeholder.com/400x200'" 
                  class="card-img-top" 
                  alt="Event cover" 
                />
                <div class="card-body">
                  <h4 class="card-title">{{ event?.name || 'Loading...' }}</h4>
                  <p class="card-text">{{ event?.description?.substring(0, 100) + '...' || 'Loading...' }}</p>
                  
                  <div class="event-details">
                    <div class="detail-item">
                      <i class="bi bi-calendar-event"></i>
                      <span>{{ formatDate(event?.startTime) || 'Loading...' }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="bi bi-clock"></i>
                      <span>{{ formatTime(event?.startTime) || 'Loading...' }}</span>
                    </div>
                    <div class="detail-item">
                      <i class="bi bi-geo-alt"></i>
                      <span>{{ event?.venue?.name || 'Loading...' }}</span>
                    </div>
                  </div>
                </div>
              </div>          
            </div>
            
            <div class="col-md-8">         
              <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading event information...</p>
              </div>
              
              <div v-else-if="error" class="alert alert-danger">
                {{ error }}
              </div>
              
              <SeatSelector
                v-else
                :eventId="eventId"
                :event="event"
              />
              
              <div class="timer-info alert alert-info mt-4" v-if="!loading">
                <i class="bi bi-info-circle-fill me-2"></i>
                <span>Seats will be held for 5 minutes. You need to complete payment within this time to confirm your booking.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '@/api/axiosInstance';
import PageHeader from '../components/PageHeader.vue';
import SeatSelector from '../components/SeatSelector.vue';

export default {
  name: 'SeatSelectionPage',
  components: {
    PageHeader,
    SeatSelector
  },
  setup() {
    const route = useRoute();
    const eventId = ref(route.params.eventId);
    const event = ref(null);
    const loading = ref(true);
    const error = ref(null);
    
    // Fetch event details
    const fetchEventDetails = async () => {
      try {
        loading.value = true;
        const response = await axiosInstance.get(`/public/events/${eventId.value}`);
        if (response.data.success) {
          event.value = response.data.data;
          console.log(event.value);
        } else {
          error.value = response.data.message;
        }
      } catch (err) {
        error.value = err.message || 'Failed to load event details';
      } finally {
        loading.value = false;
      }
    };
    
    // Format date to readable format
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
    };
    
    // Format time to readable format
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    };
    
    onMounted(() => {
      fetchEventDetails();
    });
    
    return {
      eventId,
      event,
      loading,
      error,
      formatDate,
      formatTime
    };
  }
};
</script>

<style scoped>
.seat-selection-page {
  /* min-height: 100vh; */
}

.event-info {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.event-info .card-img-top {
  width: 100%;
  height: 100px;
  object-fit: cover;
  object-position: center;
}

.event-details {
  margin-top: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #495057;
}

.detail-item i {
  color: #6c757d;
}

.booking-steps {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.steps-list {
  padding-left: 1.5rem;
  margin-top: 1rem;
}

.step {
  margin-bottom: 1rem;
  color: #6c757d;
  position: relative;
}

.step.completed {
  color: #28a745;
  font-weight: bold;
}

.step.active {
  color: #007bff;
  font-weight: bold;
}

.step.completed::before {
  content: '✓';
  position: absolute;
  left: -1.5rem;
  color: #28a745;
}

.step.active::before {
  content: '→';
  position: absolute;
  left: -1.5rem;
  color: #007bff;
}

.timer-info {
  display: flex;
  align-items: center;
}
</style> 