<template>
  <div class="payment-page">
    <div class="payment-container">
      <!-- Left side order details -->
      <div class="order-details">
        <h2>Order Details</h2>
        
        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Loading order information...</p>
        </div>
        
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        
        <div v-else>
          <div class="event-info">
            <h3>{{ event?.title }}</h3>
            <div class="event-meta">
              <div><i class="bi bi-calendar-event"></i> {{ formatDate(event?.startDate) }}</div>
              <div><i class="bi bi-clock"></i> {{ formatTime(event?.startDate) }}</div>
              <div><i class="bi bi-geo-alt"></i> {{ event?.venue?.name }}</div>
            </div>
          </div>
          
          <div class="seat-info">
            <h4>Seat Information</h4>
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Section</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="seat in selectedSeats" :key="seat.id">
                    <td>Row {{ seat.row }} - Seat {{ seat.seatNumber }}</td>
                    <td>{{ seat.section || 'Default Section' }}</td>
                    <td>${{ seat.price.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="price-summary">
            <div class="price-item">
              <span>Subtotal</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="price-item">
              <span>Service Fee</span>
              <span>${{ serviceFee.toFixed(2) }}</span>
            </div>
            <div class="price-item total">
              <span>Total</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
          </div>
          
          <div class="timer-container">
            <div class="timer-content">
              <i class="bi bi-clock-history"></i>
              <div>
                <strong>Time remaining: {{ formatTimeRemaining }}</strong>
                <div class="progress">
                  <div 
                    class="progress-bar progress-bar-striped progress-bar-animated" 
                    :class="{
                      'bg-danger': timeRemaining < 60,
                      'bg-warning': timeRemaining >= 60 && timeRemaining < 120,
                      'bg-info': timeRemaining >= 120
                    }"
                    :style="{width: `${(timeRemaining / 600) * 100}%`}" 
                    role="progressbar" 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <small>Please complete payment within the lock time, otherwise seats will be released</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right side payment methods -->
      <div class="payment-methods-container">
        <h2>Payment Method</h2>
        
        <div class="payment-methods">
          <div class="payment-method-option" :class="{ active: paymentMethod === 'credit_card' }" @click="paymentMethod = 'credit_card'">
            <i class="bi bi-credit-card"></i>
            <span>Credit Card</span>
          </div>
          
          <div class="payment-method-option" :class="{ active: paymentMethod === 'alipay' }" @click="paymentMethod = 'alipay'">
            <i class="bi bi-wallet2"></i>
            <span>Alipay</span>
          </div>
          
          <div class="payment-method-option" :class="{ active: paymentMethod === 'wechat' }" @click="paymentMethod = 'wechat'">
            <i class="bi bi-chat-dots"></i>
            <span>WeChat Pay</span>
          </div>
        </div>
        
        <div class="payment-notice">
          <i class="bi bi-info-circle"></i>
          <span>This is a demo payment system. Test credit card information has been pre-filled.</span>
        </div>
        
        <div v-if="paymentMethod === 'credit_card'" class="credit-card-form">
          <div class="form-group">
            <label for="cardNumber">Card Number</label>
            <input 
              type="text" 
              class="form-control" 
              id="cardNumber" 
              v-model="creditCard.number" 
              placeholder="1234 5678 9012 3456"
            />
          </div>
          
          <div class="card-details">
            <div class="expiry-date">
              <label for="expiry">Expiry Date</label>
              <input 
                type="text" 
                class="form-control" 
                id="expiry" 
                v-model="creditCard.expiry" 
                placeholder="MM/YY"
              />
            </div>
            
            <div class="cvv">
              <label for="cvv">CVV</label>
              <input 
                type="text" 
                class="form-control" 
                id="cvv" 
                v-model="creditCard.cvv" 
                placeholder="123"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="cardName">Cardholder Name</label>
            <input 
              type="text" 
              class="form-control" 
              id="cardName" 
              v-model="creditCard.name" 
              placeholder="John Doe"
            />
          </div>
        </div>
        
        <div v-else-if="paymentMethod === 'alipay' || paymentMethod === 'wechat'" class="qr-payment">
          <img 
            :src="`/images/${paymentMethod}-qr.png`" 
            alt="QR Code" 
            class="qr-code"
          />
          <p>Please scan the QR code above with {{ paymentMethod === 'alipay' ? 'Alipay' : 'WeChat' }} to complete payment</p>
        </div>
        
        <div v-if="error" class="payment-error">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ error }}</span>
        </div>
        
        <div class="action-buttons">
          <button 
            class="btn-confirm" 
            @click="processPayment" 
            :disabled="isProcessing"
          >
            {{ isProcessing ? 'Processing...' : 'Confirm Payment' }}
          </button>
          <button 
            class="btn-cancel" 
            @click="cancelBooking"
            :disabled="isProcessing"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
    
    <!-- Payment processing overlay -->
    <div class="payment-overlay" v-if="isProcessing">
      <div class="payment-processing-modal">
        <div class="processing-header">
          <h3>Processing Payment</h3>
          <div class="spinner-large"></div>
        </div>
        
        <div class="processing-steps">
          <div class="processing-step" :class="{ 'active': paymentStep >= 1, 'completed': paymentStep > 1 }">
            <div class="step-indicator">
              <i class="bi bi-check-circle-fill" v-if="paymentStep > 1"></i>
              <i class="bi bi-circle-fill" v-else-if="paymentStep === 1"></i>
              <i class="bi bi-circle" v-else></i>
            </div>
            <div class="step-content">
              <div class="step-title">Processing Payment</div>
              <div class="step-description">Verifying your payment information</div>
            </div>
          </div>
          
          <div class="processing-step" :class="{ 'active': paymentStep >= 2, 'completed': paymentStep > 2 }">
            <div class="step-indicator">
              <i class="bi bi-check-circle-fill" v-if="paymentStep > 2"></i>
              <i class="bi bi-circle-fill" v-else-if="paymentStep === 2"></i>
              <i class="bi bi-circle" v-else></i>
            </div>
            <div class="step-content">
              <div class="step-title">Generating Tickets</div>
              <div class="step-description">Creating your electronic tickets</div>
            </div>
          </div>
          
          <div class="processing-step" :class="{ 'active': paymentStep >= 3, 'completed': paymentStep > 3 }">
            <div class="step-indicator">
              <i class="bi bi-check-circle-fill" v-if="paymentStep > 3"></i>
              <i class="bi bi-circle-fill" v-else-if="paymentStep === 3"></i>
              <i class="bi bi-circle" v-else></i>
            </div>
            <div class="step-content">
              <div class="step-title">Completing Booking</div>
              <div class="step-description">Finalizing your reservation</div>
            </div>
          </div>
        </div>
        
        <div class="processing-message">
          <p>Please do not refresh or close this page while we process your payment.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'PaymentPage',
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
    const user = computed(() => authStore.user);
    
    const paymentMethod = ref('credit_card');
    const isProcessing = ref(false);
    const paymentStep = ref(0);
    
    const creditCard = ref({
      number: '4111 1111 1111 1111',
      expiry: '12/25',
      cvv: '123',
      name: 'John Doe'
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
      return date.toLocaleDateString('en-US', { 
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
      return date.toLocaleTimeString('en-US', { 
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
        
        // Get authentication token
        const token = authStore.token;
        
        // Set request headers
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch event details
        const eventResponse = await axiosInstance.get(`/public/events/${eventId.value}`, { headers });
        if (eventResponse.data.success) {
          event.value = eventResponse.data.data;
        } else {
          throw new Error(eventResponse.data.message);
        }
        
        // Use seat information from localStorage instead of URL parameters
        const selectedSeatsJson = localStorage.getItem('selectedSeats');
        const lockSessionId = localStorage.getItem('lockSessionId');
        
        if (!selectedSeatsJson || !lockSessionId) {
          throw new Error('Seat information has been lost. Please select seats again.');
        }
        
        // Parse seat information
        const parsedSeats = JSON.parse(selectedSeatsJson);
        selectedSeats.value = parsedSeats;
        
        // Get remaining lock time from server
        try {
          console.log(`Fetching lock time for session: ${lockSessionId}`);
          const lockTimeResponse = await axiosInstance.get(
            `/public/events/${eventId.value}/seats/lock-time?lockSessionId=${lockSessionId}`,
            { headers }
          );
          
          console.log('Lock time response:', lockTimeResponse.data);
          
          if (lockTimeResponse.data.success) {
            // Update remaining time from server
            const remainingTime = lockTimeResponse.data.data.remainingTime;
            console.log(`Remaining time from server: ${remainingTime} seconds`);
            timeRemaining.value = remainingTime;
            
            // If lock has already expired, handle expiration
            if (remainingTime <= 0) {
              handleLockExpired();
              return;
            }
          } else {
            console.warn('Failed to get lock remaining time:', lockTimeResponse.data.message);
            // If API call fails but returns a response, check if it's due to expired lock
            if (lockTimeResponse.data.message.includes('expired')) {
              handleLockExpired();
              return;
            }
            timeRemaining.value = 300; // Default 5 minutes
          }
        } catch (lockTimeError) {
          // If API call fails, use default time
          console.warn('Error fetching lock remaining time:', lockTimeError);
          timeRemaining.value = 300; // Default 5 minutes
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
        paymentStep.value = 1;
        
        // Get lock session ID
        const lockSessionId = localStorage.getItem('lockSessionId');
        const selectedSeatsJson = localStorage.getItem('selectedSeats');
        
        if (!lockSessionId || !selectedSeatsJson) {
          throw new Error('Seat lock information has been lost. Please select seats again.');
        }
        
        const selectedSeats = JSON.parse(selectedSeatsJson);
        
        // Get authentication token
        const token = authStore.token;
        
        // Set request headers
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Step 1: Process payment
        console.log('Processing payment...');
        
        // Simulate payment gateway processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Payment data to send to backend
        const paymentData = {
          eventId: eventId.value,
          lockSessionId,
          seats: selectedSeats.map(seat => ({
            row: String.fromCharCode(64 + seat.row),
            seatNumber: seat.seatNumber.toString(),
            price: seat.price
          })),
          paymentMethod: paymentMethod.value,
          amount: total.value,
          customerName: user.value?.firstName && user.value?.lastName 
            ? `${user.value.firstName} ${user.value.lastName}`
            : creditCard.value.name,
          paymentDetails: paymentMethod.value === 'credit_card' ? {
            cardNumber: creditCard.value.number.replace(/\s/g, '').slice(-4), // Only store last 4 digits for security
            cardholderName: creditCard.value.name,
            expiryDate: creditCard.value.expiry
          } : {
            method: paymentMethod.value
          }
        };
        
        // Move to step 2
        paymentStep.value = 2;
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Confirm booking and generate tickets
        console.log('Confirming booking and generating tickets...');
        const response = await axiosInstance.post('/public/bookings/confirm', paymentData, { headers });
        
        if (response.data.success) {
          // Move to step 3
          paymentStep.value = 3;
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clear lock information
          localStorage.removeItem('lockSessionId');
          
          // Store booking confirmation data for the confirmation page
          localStorage.setItem('bookingConfirmation', JSON.stringify({
            bookingId: response.data.data.bookingId,
            eventTitle: event.value.title,
            eventDate: event.value.startDate,
            seats: selectedSeats,
            amount: total.value,
            timestamp: new Date().toISOString(),
            // Store ticket information from API response
            tickets: response.data.data.tickets,
            paymentMethod: response.data.data.paymentMethod,
            status: response.data.data.status,
            // Store user information
            user: {
              firstName: user.value?.firstName || creditCard.value.name.split(' ')[0] || '',
              lastName: user.value?.lastName || creditCard.value.name.split(' ').slice(1).join(' ') || '',
              fullName: user.value?.firstName && user.value?.lastName 
                ? `${user.value.firstName} ${user.value.lastName}` 
                : creditCard.value.name
            }
          }));
          
          // Redirect to confirmation page
          router.push({
            name: 'booking-confirmation',
            params: { 
              eventId: eventId.value
            },
            query: { 
              bookingId: response.data.data.bookingId,
              // Pass ticket IDs as query parameters
              ticketIds: response.data.data.tickets.map(ticket => ticket.ticketId).join(','),
              timestamp: new Date().getTime()
            }
          });
        } else {
          throw new Error(response.data.message || 'Payment processing failed');
        }
      } catch (err) {
        console.error('Payment error:', err);
        error.value = err.response?.data?.message || err.message || 'Payment processing failed';
        
        // Show more detailed error message if available
        if (err.response?.data?.details) {
          error.value += `: ${err.response.data.details}`;
        }
        
        // Reset payment step
        paymentStep.value = 0;
      } finally {
        isProcessing.value = false;
      }
    };
    
    // Cancel booking and release seats
    const cancelBooking = async () => {
      try {
        // Get lock session ID
        const lockSessionId = localStorage.getItem('lockSessionId');
        const selectedSeatsJson = localStorage.getItem('selectedSeats');
        
        if (lockSessionId && selectedSeatsJson) {
          const selectedSeats = JSON.parse(selectedSeatsJson);
          
          // Use lock session ID to unlock seats
          await axiosInstance.post(`/public/events/${eventId.value}/seats/unlock`, {
            lockSessionId,
            seats: selectedSeats.map(seat => ({
              row: String.fromCharCode(64 + seat.row), // Convert to letter row number (1->A, 2->B, etc.)
              seatNumber: seat.seatNumber.toString()
            }))
          });
          
          // Clear local storage
          localStorage.removeItem('lockSessionId');
          localStorage.removeItem('selectedSeats');
        }
        
        // Redirect back to event details page
        router.push({ name: 'event-details', params: { id: eventId.value } });
      } catch (err) {
        console.error('Failed to release seats:', err);
        // Redirect even if unlock fails
        router.push({ name: 'event-details', params: { id: eventId.value } });
      }
    };
    
    // Refresh lock time from server
    const refreshLockTime = async () => {
      const lockSessionId = localStorage.getItem('lockSessionId');
      if (!lockSessionId) return;
      
      try {
        const token = authStore.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axiosInstance.get(
          `/public/events/${eventId.value}/seats/lock-time?lockSessionId=${lockSessionId}`,
          { headers }
        );
        
        if (response.data.success) {
          console.log('Lock time API response:', response.data);
          // 更新剩余时间，使用服务器返回的准确时间
          timeRemaining.value = response.data.data.remainingTime;
          
          // 如果剩余时间小于等于0，处理过期情况
          if (timeRemaining.value <= 0) {
            handleLockExpired();
          }
        } else {
          console.warn('Failed to get lock time:', response.data.message);
        }
      } catch (err) {
        console.warn('Failed to refresh lock time:', err);
      }
    };
    
    // 处理锁定过期的情况
    const handleLockExpired = () => {
      // 清除计时器
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
      }
      
      error.value = 'Seat lock has expired. Please select seats again.';
      
      // 获取锁定会话ID并解锁座位
      const lockSessionId = localStorage.getItem('lockSessionId');
      const selectedSeatsJson = localStorage.getItem('selectedSeats');
      
      if (lockSessionId && selectedSeatsJson) {
        const selectedSeats = JSON.parse(selectedSeatsJson);
        
        // 使用锁定会话ID解锁座位
        axiosInstance.post(`/public/events/${eventId.value}/seats/unlock`, {
          lockSessionId,
          seats: selectedSeats.map(seat => ({
            row: String.fromCharCode(64 + seat.row),
            seatNumber: seat.seatNumber.toString()
          }))
        }).catch(err => console.error('Failed to unlock seats on timeout:', err));
        
        // 清除本地存储
        localStorage.removeItem('lockSessionId');
        localStorage.removeItem('selectedSeats');
      }
      
      // 延迟后重定向到事件详情页面
      setTimeout(() => {
        router.push({ name: 'event-details', params: { id: eventId.value } });
      }, 3000);
    };
    
    // Start countdown timer
    const startTimer = () => {
      // 立即刷新一次以获取准确的时间
      refreshLockTime();
      
      // 设置定时器
      timerInterval.value = setInterval(() => {
        if (timeRemaining.value > 0) {
          timeRemaining.value--;
          
          // 每30秒从服务器刷新一次时间以确保准确性
          if (timeRemaining.value % 30 === 0) {
            refreshLockTime();
          }
        } else {
          // 时间已过期，处理过期情况
          handleLockExpired();
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
      
      // Don't automatically unlock seats when navigating away from payment page
      // This allows the user to refresh the page without losing their seat lock
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
      cancelBooking,
      paymentStep
    };
  }
};
</script>

<style scoped>
.payment-page {
  padding: 40px 0;
}

.payment-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Left side order details styles */
.order-details {
  flex: 1;
  padding: 40px;
  border-right: 1px solid #eaeaea;
}

.order-details h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
  color: #333;
}

.event-info {
  margin-bottom: 30px;
}

.event-info h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 10px;
  color: #6c757d;
}

.event-meta i {
  margin-right: 8px;
}

.seat-info {
  margin-bottom: 30px;
}

.seat-info h4 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
}

.price-summary {
  margin-top: 30px;
  border-top: 1px solid #eaeaea;
  padding-top: 20px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 16px;
}

.price-item.total {
  font-weight: 700;
  font-size: 18px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #eaeaea;
}

.timer-container {
  margin-top: 30px;
  background-color: #fff8e1;
  border-radius: 8px;
  padding: 15px;
}

.timer-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.timer-content i {
  font-size: 24px;
  color: #ff9800;
}

.progress {
  height: 8px;
  margin: 10px 0;
  border-radius: 4px;
}

/* Right side payment methods styles */
.payment-methods-container {
  width: 400px;
  padding: 40px;
  background-color: #fff;
}

.payment-methods-container h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
  color: #333;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.payment-method-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
}

.payment-method-option:hover {
  border-color: #007bff;
}

.payment-method-option.active {
  border-color: #007bff;
  background-color: #f0f7ff;
}

.payment-method-option i {
  font-size: 18px;
  margin-right: 15px;
  color: #555;
}

.payment-method-option.active i {
  color: #007bff;
}

.payment-notice {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #e8f4fd;
  border-radius: 6px;
  font-size: 14px;
  color: #0066cc;
}

.payment-notice i {
  margin-right: 8px;
  font-size: 16px;
}

.credit-card-form {
  margin-top: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.card-details {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.expiry-date {
  flex: 1;
}

.cvv {
  flex: 1;
}

.form-control {
  width: 100%;
  padding: 12px 0px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.form-control:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.qr-payment {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
}

.qr-code {
  max-width: 200px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
}

.action-buttons {
  margin-top: 40px;
}

.btn-confirm {
  display: block;
  width: 100%;
  padding: 14px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-bottom: 15px;
}

.btn-confirm:hover {
  background-color: #0069d9;
}

.btn-confirm:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.btn-cancel {
  display: block;
  width: 100%;
  padding: 14px;
  background-color: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background-color: #f8f9fa;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 992px) {
  .payment-container {
    flex-direction: column;
    margin: 0 20px;
  }
  
  .order-details {
    border-right: none;
    border-bottom: 1px solid #eaeaea;
  }
  
  .payment-methods-container {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .payment-page {
    padding: 20px 0;
  }
  
  .order-details, 
  .payment-methods-container {
    padding: 20px;
  }
  
  .event-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 20px;
  }
}

.payment-error {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 20px;
  background-color: #ffebee;
  border-radius: 6px;
  font-size: 14px;
  color: #d32f2f;
}

.payment-error i {
  margin-right: 8px;
  font-size: 16px;
}

/* Payment processing overlay */
.payment-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.payment-processing-modal {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  padding: 30px;
}

.processing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.processing-header h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 123, 255, 0.3);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s ease-in-out infinite;
}

.processing-steps {
  margin-bottom: 30px;
}

.processing-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.processing-step.active {
  opacity: 1;
}

.processing-step.completed {
  opacity: 1;
}

.step-indicator {
  margin-right: 15px;
  font-size: 24px;
  color: #ccc;
  line-height: 1;
}

.processing-step.active .step-indicator {
  color: #007bff;
}

.processing-step.completed .step-indicator {
  color: #28a745;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 16px;
}

.step-description {
  font-size: 14px;
  color: #6c757d;
}

.processing-message {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  font-size: 14px;
  color: #6c757d;
}
</style> 