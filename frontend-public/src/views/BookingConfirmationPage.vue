<template>
  <div class="booking-confirmation-page">
    <div class="confirmation-header">
      <div class="container text-center py-5">
        <div class="success-icon mb-4">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <h1>Booking Successful!</h1>
        <p class="lead">Your seats have been successfully booked, thank you for using our service</p>
      </div>
    </div>
    
    <div class="container my-5">
      <div class="row">
        <div class="col-lg-10 mx-auto">
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
            <div v-if="ticketIds.length > 0" class="tickets-container mb-4">
              <h4 class="section-title text-center mb-4">Your Tickets</h4>
              <div class="row justify-content-center ticket-row">
                <div v-for="ticketId in ticketIds" :key="ticketId" class="col-12 col-sm-6 col-lg-5 mb-4 ticket-column">
                  <TicketCard 
                    :ticketId="ticketId"
                    :showActions="true"
                    @download="downloadTicket"
                    @viewDetails="viewTicketDetails"
                  />
                </div>
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
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import TicketCard from '../components/TicketCard.vue';

export default {
  name: 'BookingConfirmationPage',
  components: {
    TicketCard
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    const bookingId = ref(route.query.bookingId);
    const ticketIds = ref(route.query.ticketIds?.toString().split(',') || []);
    
    const loading = ref(true);
    const error = ref(null);
    
    // Check authentication and ticket IDs
    const checkAuthAndTickets = async () => {
      try {
        loading.value = true;
        
        // Check if user is authenticated
        if (!authStore.isAuthenticated) {
          router.push({ name: 'login' });
          return;
        }
        
        // Check if we have ticket IDs
        if (ticketIds.value.length === 0) {
          error.value = 'No ticket information found';
        }
        
      } catch (err) {
        error.value = err.message || 'Failed to load ticket details';
      } finally {
        loading.value = false;
      }
    };
    
    // Download a single ticket
    const downloadTicket = (ticketId) => {
      // In a real application, this would generate and download a PDF
      alert(`Ticket download feature is under development for ticket: ${ticketId}...`);
    };
    
    // Download all tickets
    const downloadAllTickets = () => {
      // In a real application, this would generate and download all tickets as PDF
      alert('Download all tickets feature is under development...');
    };
    
    // Go to my tickets page
    const goToMyTickets = () => {
      router.push({ name: 'my-tickets' });
    };
    
    // View ticket details
    const viewTicketDetails = (ticketId) => {
      router.push({ name: 'ticket-details', params: { ticketId } });
    };
    
    onMounted(() => {
      checkAuthAndTickets();
    });
    
    return {
      ticketIds,
      bookingId,
      loading,
      error,
      downloadTicket,
      downloadAllTickets,
      goToMyTickets,
      viewTicketDetails
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
  padding: 5px 0;
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

/* Ticket card styles */
.ticket-card {
  border: 1px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.ticket-header {
  background-color: #007bff;
  color: white;
  padding: 15px;
  text-align: center;
}

.ticket-header h5 {
  margin-bottom: 5px;
  font-weight: 600;
}

.ticket-number {
  margin-bottom: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.ticket-body {
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ticket-info p {
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.ticket-qr {
  margin-top: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 5px;
}

/* 新增的TicketView样式 */
.ticket-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
}

.ticket-card {
  background: white;
  border-radius: 20px;
  padding: 1.2rem;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.event-image {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 1rem;
  object-fit: cover;
}

.event-info h2 {
  font-size: 1.2rem;
  font-weight: bold;
}

.venue {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 1rem;
}

.ticket-details {
  text-align: left;
  margin: 1rem 0;
}

.detail-pair {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.label {
  font-size: 0.75rem;
  color: #666;
}

.value {
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
}

.barcode img {
  width: 100%;
  height: auto;
  margin: 1rem 0 0.5rem;
}

.barcode-note {
  font-size: 0.75rem;
  color: #666;
}

.ticket-row {
  display: flex;
  flex-wrap: wrap;
}

.ticket-column {
  display: flex;
}

@media (max-width: 767.98px) {
  .ticket-row {
    flex-direction: column;
    align-items: center;
  }
  
  .ticket-column {
    width: 100%;
    max-width: 320px;
  }
}

@media (min-width: 768px) {
  .tickets-container {
    max-width: 760px;
    margin: 0 auto;
  }
}
</style> 