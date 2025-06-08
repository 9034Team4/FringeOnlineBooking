<template>
  <div class="booking-confirmation-page">
    <div class="confirmation-header">
      <div class="container text-center py-5">
        <div class="success-icon mb-4">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h1>预订成功！</h1>
        <p class="lead">您的座位已成功预订，感谢您使用我们的服务</p>
      </div>
    </div>
    
    <div class="container my-5">
      <div class="row">
        <div class="col-lg-8 mx-auto">
          <div class="card confirmation-card">
            <div class="card-body">
              <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">正在加载订单信息...</p>
              </div>
              
              <div v-else-if="error" class="alert alert-danger">
                {{ error }}
              </div>
              
              <div v-else>
                <div class="confirmation-details">
                  <div class="text-center mb-4">
                    <h3>{{ event?.title }}</h3>
                    <p class="text-muted">订单编号: #{{ generateOrderNumber() }}</p>
                  </div>
                  
                  <div class="event-info mb-4">
                    <div class="row info-row">
                      <div class="col-md-4 info-label">
                        <i class="bi bi-calendar-event"></i> 日期:
                      </div>
                      <div class="col-md-8 info-value">
                        {{ formatDate(event?.startDate) }}
                      </div>
                    </div>
                    
                    <div class="row info-row">
                      <div class="col-md-4 info-label">
                        <i class="bi bi-clock"></i> 时间:
                      </div>
                      <div class="col-md-8 info-value">
                        {{ formatTime(event?.startDate) }}
                      </div>
                    </div>
                    
                    <div class="row info-row">
                      <div class="col-md-4 info-label">
                        <i class="bi bi-geo-alt"></i> 地点:
                      </div>
                      <div class="col-md-8 info-value">
                        {{ event?.venue?.name }}
                      </div>
                    </div>
                    
                    <div class="row info-row">
                      <div class="col-md-4 info-label">
                        <i class="bi bi-person"></i> 姓名:
                      </div>
                      <div class="col-md-8 info-value">
                        {{ user?.firstName }} {{ user?.lastName }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="ticket-details mb-4">
                    <h4 class="section-title">座位信息</h4>
                    <div class="table-responsive">
                      <table class="table">
                        <thead>
                          <tr>
                            <th>区域</th>
                            <th>行</th>
                            <th>座位号</th>
                            <th>价格</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="seat in selectedSeats" :key="seat.id">
                            <td>{{ seat.section || '默认区域' }}</td>
                            <td>{{ seat.row }}</td>
                            <td>{{ seat.seatNumber }}</td>
                            <td>${{ seat.price.toFixed(2) }}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="3" class="text-end"><strong>总计:</strong></td>
                            <td><strong>${{ calculateTotal().toFixed(2) }}</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  
                  <div class="qr-code text-center mb-4">
                    <h4 class="section-title">入场二维码</h4>
                    <p class="text-muted">请在活动当天出示此二维码</p>
                    <img src="/images/qr-code-sample.png" alt="Entry QR Code" class="img-fluid" style="max-width: 200px;" />
                  </div>
                  
                  <div class="important-info alert alert-info">
                    <h5><i class="bi bi-info-circle"></i> 重要信息</h5>
                    <ul>
                      <li>活动开始前30分钟入场</li>
                      <li>请携带身份证明文件</li>
                      <li>入场后请遵守场馆规定</li>
                      <li>禁止携带食物和饮料进入场馆</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="action-buttons mt-5 d-flex justify-content-center gap-3">
                <button class="btn btn-primary" @click="downloadTicket">
                  <i class="bi bi-download me-2"></i> 下载票据
                </button>
                <button class="btn btn-outline-primary" @click="goToMyTickets">
                  <i class="bi bi-ticket-perforated me-2"></i> 查看我的票
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'BookingConfirmationPage',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    const eventId = ref(route.params.eventId);
    const seatIds = ref(route.query.seats?.toString().split(',').map(Number) || []);
    const bookingTimestamp = ref(route.query.timestamp || Date.now());
    
    const event = ref(null);
    const selectedSeats = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const user = computed(() => authStore.user);
    
    // Format date
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
    
    // Format time
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    };
    
    // Generate order number based on timestamp and user ID
    const generateOrderNumber = () => {
      const timestamp = new Date(parseInt(bookingTimestamp.value)).getTime();
      const userId = user.value?.id || '0000';
      return `${timestamp.toString().substring(5)}${userId.substring(0, 4)}`;
    };
    
    // Calculate total price
    const calculateTotal = () => {
      return selectedSeats.value.reduce((total, seat) => total + seat.price, 0);
    };
    
    // Fetch event and seat details
    const fetchData = async () => {
      try {
        loading.value = true;
        
        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
          router.push({ name: 'login' });
          return;
        }
        
        // Fetch event details
        const eventResponse = await axios.get(`/api/public/events/${eventId.value}`);
        if (eventResponse.data.success) {
          event.value = eventResponse.data.data;
        } else {
          throw new Error(eventResponse.data.message);
        }
        
        // Fetch detailed seat information for booked seats
        const seatDetailsResponse = await axios.get(`/api/events/${eventId.value}/seats`);
        if (seatDetailsResponse.data.success) {
          const allSeats = seatDetailsResponse.data.data;
          selectedSeats.value = allSeats.filter(s => seatIds.value.includes(s.id));
        } else {
          throw new Error(seatDetailsResponse.data.message);
        }
      } catch (err) {
        error.value = err.message || 'Failed to load booking details';
      } finally {
        loading.value = false;
      }
    };
    
    // Download ticket as PDF
    const downloadTicket = () => {
      // In a real application, this would generate and download a PDF
      alert('票据下载功能正在开发中...');
    };
    
    // Go to my tickets page
    const goToMyTickets = () => {
      router.push({ name: 'my-tickets' });
    };
    
    onMounted(() => {
      fetchData();
    });
    
    return {
      event,
      selectedSeats,
      loading,
      error,
      user,
      formatDate,
      formatTime,
      generateOrderNumber,
      calculateTotal,
      downloadTicket,
      goToMyTickets
    };
  }
};
</script>

<style scoped>
.booking-confirmation-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.confirmation-header {
  background-color: #28a745;
  color: white;
  padding: 2rem 0;
}

.success-icon {
  font-size: 5rem;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.9;
  }
}

.confirmation-card {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 10px;
}

.section-title {
  position: relative;
  padding-bottom: 10px;
  margin-bottom: 20px;
  color: #333;
  font-weight: 600;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #28a745;
}

.info-row {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.info-label {
  font-weight: 600;
  color: #6c757d;
}

.info-value {
  color: #212529;
}

.important-info {
  border-left: 4px solid #17a2b8;
}

.important-info h5 {
  color: #17a2b8;
  font-weight: 600;
}

.important-info ul {
  margin-bottom: 0;
  padding-left: 1.5rem;
}

.action-buttons .btn {
  padding: 0.5rem 1.5rem;
}
</style> 