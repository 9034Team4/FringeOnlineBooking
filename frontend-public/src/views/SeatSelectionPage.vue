<template>
  <div class="seat-selection-page">
    <PageHeader title="选择座位" subtitle="请选择您想要预订的座位" />
    
    <div class="container my-5">
      <div class="row">
        <div class="col-md-4">
          <div class="event-info card">
            <img 
              :src="event?.coverImage || 'https://via.placeholder.com/400x200'" 
              class="card-img-top" 
              alt="Event cover" 
            />
            <div class="card-body">
              <h4 class="card-title">{{ event?.title || '加载中...' }}</h4>
              <p class="card-text">{{ event?.description?.substring(0, 100) + '...' || '加载中...' }}</p>
              
              <div class="event-details">
                <div class="detail-item">
                  <i class="bi bi-calendar-event"></i>
                  <span>{{ formatDate(event?.startDate) || '加载中...' }}</span>
                </div>
                <div class="detail-item">
                  <i class="bi bi-clock"></i>
                  <span>{{ formatTime(event?.startDate) || '加载中...' }}</span>
                </div>
                <div class="detail-item">
                  <i class="bi bi-geo-alt"></i>
                  <span>{{ event?.venue?.name || '加载中...' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="booking-steps card mt-4">
            <div class="card-body">
              <h5 class="card-title">预订步骤</h5>
              <ol class="steps-list">
                <li class="step completed">选择活动</li>
                <li class="step active">选择座位</li>
                <li class="step">支付</li>
                <li class="step">确认</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div class="col-md-8">
          <div v-if="loading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">正在加载座位信息...</p>
          </div>
          
          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <SeatSelector 
            v-else 
            :eventId="eventId" 
          />
          
          <div class="timer-info alert alert-info mt-4" v-if="!loading">
            <i class="bi bi-info-circle-fill me-2"></i>
            <span>座位将被锁定5分钟。在此期间，您需要完成支付以确认预订。</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
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
        const response = await axios.get(`/api/public/events/${eventId.value}`);
        if (response.data.success) {
          event.value = response.data.data;
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
      return date.toLocaleDateString('zh-CN', { 
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
      return date.toLocaleTimeString('zh-CN', { 
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
  min-height: 100vh;
}

.event-info {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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