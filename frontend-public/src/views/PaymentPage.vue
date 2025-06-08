<template>
  <div class="payment-page">
    <PageHeader title="支付确认" subtitle="完成支付以确认您的座位预订" />
    
    <div class="container my-5">
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title mb-4">订单详情</h3>
              
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
                <div class="event-info mb-4">
                  <h4>{{ event?.title }}</h4>
                  <div class="event-meta">
                    <div><i class="bi bi-calendar-event"></i> {{ formatDate(event?.startDate) }}</div>
                    <div><i class="bi bi-clock"></i> {{ formatTime(event?.startDate) }}</div>
                    <div><i class="bi bi-geo-alt"></i> {{ event?.venue?.name }}</div>
                  </div>
                </div>
                
                <h5 class="mb-3">座位信息</h5>
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>位置</th>
                        <th>区域</th>
                        <th>价格</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="seat in selectedSeats" :key="seat.id">
                        <td>Row {{ seat.row }} - Seat {{ seat.seatNumber }}</td>
                        <td>{{ seat.section || '默认区域' }}</td>
                        <td>${{ seat.price.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" class="text-end"><strong>小计:</strong></td>
                        <td>${{ subtotal.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td colspan="2" class="text-end"><strong>服务费:</strong></td>
                        <td>${{ serviceFee.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td colspan="2" class="text-end"><strong>总计:</strong></td>
                        <td><strong>${{ total.toFixed(2) }}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div class="alert alert-warning mt-4">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-clock-history me-2 fs-4"></i>
                    <div>
                      <strong>锁定时间剩余: {{ formatTimeRemaining }}</strong>
                      <div class="progress mt-2">
                        <div 
                          class="progress-bar progress-bar-striped progress-bar-animated" 
                          :class="{'bg-danger': timeRemaining < 60}"
                          :style="{width: `${(timeRemaining / 300) * 100}%`}" 
                          role="progressbar" 
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <small>请在锁定时间内完成支付，否则座位将被释放</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title mb-4">支付方式</h3>
              
              <div class="payment-methods">
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="paymentMethod" 
                    id="creditCard" 
                    value="credit_card" 
                    v-model="paymentMethod" 
                    checked
                  />
                  <label class="form-check-label" for="creditCard">
                    <i class="bi bi-credit-card me-2"></i> 信用卡支付
                  </label>
                </div>
                
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="paymentMethod" 
                    id="alipay" 
                    value="alipay"
                    v-model="paymentMethod"
                  />
                  <label class="form-check-label" for="alipay">
                    <i class="bi bi-wallet2 me-2"></i> 支付宝
                  </label>
                </div>
                
                <div class="form-check mb-3">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    name="paymentMethod" 
                    id="wechat" 
                    value="wechat"
                    v-model="paymentMethod"
                  />
                  <label class="form-check-label" for="wechat">
                    <i class="bi bi-chat-dots me-2"></i> 微信支付
                  </label>
                </div>
              </div>
              
              <div v-if="paymentMethod === 'credit_card'" class="credit-card-form mt-4">
                <div class="mb-3">
                  <label for="cardNumber" class="form-label">卡号</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="cardNumber" 
                    v-model="creditCard.number" 
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="expiry" class="form-label">到期日</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      id="expiry" 
                      v-model="creditCard.expiry" 
                      placeholder="MM/YY"
                    />
                  </div>
                  
                  <div class="col-md-6 mb-3">
                    <label for="cvv" class="form-label">CVV</label>
                    <input 
                      type="text" 
                      class="form-control" 
                      id="cvv" 
                      v-model="creditCard.cvv" 
                      placeholder="123"
                    />
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="cardName" class="form-label">持卡人姓名</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="cardName" 
                    v-model="creditCard.name" 
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div v-else-if="paymentMethod === 'alipay' || paymentMethod === 'wechat'" class="qr-payment mt-4 text-center">
                <img 
                  :src="`/images/${paymentMethod}-qr.png`" 
                  alt="QR Code" 
                  class="img-fluid mb-3" 
                  style="max-width: 200px;"
                />
                <p>请使用{{ paymentMethod === 'alipay' ? '支付宝' : '微信' }}扫描上方二维码完成支付</p>
              </div>
              
              <div class="d-grid gap-2 mt-4">
                <button 
                  class="btn btn-primary" 
                  @click="processPayment" 
                  :disabled="isProcessing"
                >
                  {{ isProcessing ? '处理中...' : '确认支付' }}
                </button>
                <button 
                  class="btn btn-outline-secondary" 
                  @click="cancelBooking"
                  :disabled="isProcessing"
                >
                  取消
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import PageHeader from '../components/PageHeader.vue';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'PaymentPage',
  components: {
    PageHeader
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    const eventId = ref(route.params.eventId);
    const seatIds = ref(route.query.seats?.toString().split(',').map(Number) || []);
    
    const event = ref(null);
    const selectedSeats = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    const paymentMethod = ref('credit_card');
    const isProcessing = ref(false);
    
    const creditCard = ref({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    });
    
    // Timer for seat lock
    const timeRemaining = ref(300); // 5 minutes in seconds
    const timerInterval = ref(null);
    
    // Calculate subtotal
    const subtotal = computed(() => {
      return selectedSeats.value.reduce((total, seat) => total + seat.price, 0);
    });
    
    // Calculate service fee (e.g., 10% of subtotal)
    const serviceFee = computed(() => {
      return subtotal.value * 0.1;
    });
    
    // Calculate total
    const total = computed(() => {
      return subtotal.value + serviceFee.value;
    });
    
    // Format time remaining (MM:SS)
    const formatTimeRemaining = computed(() => {
      const minutes = Math.floor(timeRemaining.value / 60);
      const seconds = timeRemaining.value % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    });
    
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
    
    // Fetch event and seat details
    const fetchData = async () => {
      try {
        loading.value = true;
        
        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
          router.push({ name: 'login', query: { redirect: route.fullPath } });
          return;
        }
        
        // Fetch event details
        const eventResponse = await axios.get(`/api/public/events/${eventId.value}`);
        if (eventResponse.data.success) {
          event.value = eventResponse.data.data;
        } else {
          throw new Error(eventResponse.data.message);
        }
        
        // Fetch seat lock status
        const seatsString = seatIds.value.join(',');
        const seatsResponse = await axios.get(`/api/seats/lock-status?eventId=${eventId.value}&seatIds=${seatsString}`);
        
        if (seatsResponse.data.success) {
          // Filter only locked seats
          const lockedSeats = seatsResponse.data.data.filter(s => s.status === 'locked');
          
          // Check if all selected seats are still locked by this user
          if (lockedSeats.length !== seatIds.value.length) {
            throw new Error('部分座位已不再可用，请返回选择其他座位');
          }
          
          // Fetch detailed seat information
          const seatDetailsResponse = await axios.get(`/api/events/${eventId.value}/seats`);
          if (seatDetailsResponse.data.success) {
            const allSeats = seatDetailsResponse.data.data;
            selectedSeats.value = allSeats.filter(s => seatIds.value.includes(s.id));
            
            // Get remaining lock time from first seat (all should have same time)
            if (lockedSeats.length > 0 && lockedSeats[0].remainingLockTime) {
              timeRemaining.value = lockedSeats[0].remainingLockTime;
            }
          }
        } else {
          throw new Error(seatsResponse.data.message);
        }
      } catch (err) {
        error.value = err.message || 'Failed to load booking details';
      } finally {
        loading.value = false;
      }
    };
    
    // Process payment
    const processPayment = async () => {
      try {
        isProcessing.value = true;
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Confirm booking after payment
        const response = await axios.post('/api/seats/confirm', {
          eventId: eventId.value,
          seatIds: seatIds.value
        });
        
        if (response.data.success) {
          // Redirect to confirmation page
          router.push({
            name: 'booking-confirmation',
            params: { 
              eventId: eventId.value
            },
            query: { 
              seats: seatIds.value.join(','),
              timestamp: new Date().getTime()
            }
          });
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        error.value = err.response?.data?.message || err.message || 'Payment processing failed';
      } finally {
        isProcessing.value = false;
      }
    };
    
    // Cancel booking and release seats
    const cancelBooking = async () => {
      try {
        await axios.post('/api/seats/release-locks', {
          eventId: eventId.value,
          seatIds: seatIds.value
        });
        
        // Redirect back to event page
        router.push({ name: 'event-details', params: { id: eventId.value } });
      } catch (err) {
        console.error('Failed to release seats:', err);
        // Still redirect even if release fails
        router.push({ name: 'event-details', params: { id: eventId.value } });
      }
    };
    
    // Start countdown timer
    const startTimer = () => {
      timerInterval.value = setInterval(() => {
        if (timeRemaining.value > 0) {
          timeRemaining.value--;
        } else {
          // Time expired, redirect back to seat selection
          clearInterval(timerInterval.value);
          error.value = '座位锁定已过期，请重新选择座位';
          setTimeout(() => {
            router.push({ name: 'event-details', params: { id: eventId.value } });
          }, 3000);
        }
      }, 1000);
    };
    
    onMounted(() => {
      fetchData().then(() => {
        startTimer();
      });
    });
    
    onBeforeUnmount(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
      }
    });
    
    return {
      eventId,
      seatIds,
      event,
      selectedSeats,
      loading,
      error,
      paymentMethod,
      creditCard,
      isProcessing,
      timeRemaining,
      subtotal,
      serviceFee,
      total,
      formatTimeRemaining,
      formatDate,
      formatTime,
      processPayment,
      cancelBooking
    };
  }
};
</script>

<style scoped>
.payment-page {
  min-height: 100vh;
}

.card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  color: #6c757d;
}

.event-meta i {
  margin-right: 0.5rem;
}

.payment-methods .form-check-label {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .event-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 