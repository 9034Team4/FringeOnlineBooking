<template>
  <div class="ticket-details-page">
    <div class="container py-5">
      <div class="row">
        <div class="col-lg-10 mx-auto">
          <div class="back-link mb-4">
            <a href="#" @click.prevent="router.back()" class="text-decoration-none">
              <i class="bi bi-arrow-left"></i> Back to My Tickets
            </a>
          </div>
          
          <div v-if="loading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading ticket details...</p>
          </div>
          
          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <div v-else class="ticket-details-container">
            <div class="row">
              <div class="col-md-5 mb-4 mb-md-0">
                <TicketCard 
                  :ticketId="ticket.ticketId"
                  :status="ticket.status"
                />
                
                <div class="d-grid gap-2 mt-4">
                  <button class="btn btn-primary" @click="downloadTicket">
                    <i class="bi bi-download me-2"></i> Download Ticket
                  </button>
                  <button class="btn btn-outline-primary" @click="shareTicket">
                    <i class="bi bi-share me-2"></i> Share Ticket
                  </button>
                </div>
              </div>
              
              <div class="col-md-7">
                <div class="card ticket-info-card">
                  <div class="card-body">
                    <h2 class="card-title mb-4">Ticket Information</h2>
                    
                    <div class="ticket-status-badge mb-4">
                      <span class="badge" :class="getStatusBadgeClass()">
                        {{ ticket.status }}
                      </span>
                    </div>
                    
                    <div class="ticket-info-section">
                      <h3 class="section-title">Event Details</h3>
                      <div class="info-item">
                        <div class="info-label">Event Name</div>
                        <div class="info-value">{{ ticket.eventTitle }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">{{ formatDate(ticket.eventDate) }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Time</div>
                        <div class="info-value">{{ formatTime(ticket.eventDate) }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Venue</div>
                        <div class="info-value">{{ ticket.venueName }}</div>
                      </div>
                    </div>
                    
                    <div class="ticket-info-section">
                      <h3 class="section-title">Ticket Details</h3>
                      <div class="info-item">
                        <div class="info-label">Ticket Number</div>
                        <div class="info-value">{{ ticket.ticketNumber }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Ticket ID</div>
                        <div class="info-value">{{ ticket.ticketId }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Seat</div>
                        <div class="info-value">{{ ticket.seatInfo }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Price</div>
                        <div class="info-value">${{ ticket.price.toFixed(2) }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">Purchase Date</div>
                        <div class="info-value">{{ formatDate(ticket.purchaseDate) }}</div>
                      </div>
                    </div>
                    
                    <div v-if="ticket.status === 'ACTIVE'" class="ticket-info-section">
                      <h3 class="section-title">Venue Information</h3>
                      <div class="venue-map mt-3">
                        <div class="p-3 bg-light rounded">
                          <p class="mb-0 text-center">Venue map will be available soon</p>
                        </div>
                      </div>
                      <div class="venue-notes mt-3">
                        <ul>
                          <li>Please arrive 30 minutes before the event starts</li>
                          <li>Entry through main gate. Have your ticket QR code ready for scanning</li>
                          <li>No outside food or drinks allowed</li>
                          <li>Free parking available for ticket holders</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div v-if="ticket.status === 'ACTIVE'" class="contact-info mt-4">
                      <p>
                        <strong>Need help?</strong> Contact event organizer at 
                        <a href="mailto:support@fringefestival.com">support@fringefestival.com</a> 
                        or call <a href="tel:+15551234567">+1 (555) 123-4567</a>
                      </p>
                    </div>
                  </div>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '../stores/auth';
import TicketCard from '../components/TicketCard.vue';

export default {
  name: 'TicketDetailsPage',
  components: {
    TicketCard
  },
  props: {
    id: {
      type: String,
      required: false
    }
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    // Get ticket ID from props or route params
    const ticketId = computed(() => props.id || route.params.id);
    
    const ticket = ref({
      ticketId: '',
      eventId: '',
      eventTitle: '',
      eventDate: '',
      venueName: '',
      seatInfo: '',
      ticketNumber: '',
      price: 0,
      status: 'ACTIVE',
      purchaseDate: '',
      bookingId: '',
      eventImage: '/assets/images/event-0.png'
    });
    
    const loading = ref(true);
    const error = ref(null);
    
    // User name
    const userName = computed(() => {
      if (authStore.user) {
        return `${authStore.user.firstName || ''} ${authStore.user.lastName || ''}`.trim();
      }
      return 'Unknown User';
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
    
    // Generate QR code content
    const generateQRValue = () => {
      const qrData = {
        ticketId: ticket.value.ticketId,
        eventId: ticket.value.eventId,
        bookingId: ticket.value.bookingId,
        seat: ticket.value.seatInfo,
        ticketNumber: ticket.value.ticketNumber,
        userId: authStore.user?.id
      };
      
      return JSON.stringify(qrData);
    };
    
    // Get status badge class based on ticket status
    const getStatusBadgeClass = () => {
      switch (ticket.value.status) {
        case 'ACTIVE':
          return 'bg-success';
        case 'USED':
          return 'bg-secondary';
        case 'EXPIRED':
          return 'bg-danger';
        case 'CANCELLED':
          return 'bg-warning text-dark';
        default:
          return 'bg-info';
      }
    };
    
    // Fetch ticket details
    const fetchTicketDetails = async () => {
      try {
        loading.value = true;
        
        // Check if user is logged in
        if (!authStore.isAuthenticated) {
          router.push({ name: 'login', query: { redirect: route.fullPath } });
          return;
        }
        
        // In a real application, this would fetch ticket data from API
        const response = await axiosInstance.get(`/public/tickets/${ticketId.value}`, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        if (response.data.success) {
          ticket.value = {
            ...response.data.data,
            // Set default values for potentially missing fields
            seatInfo: response.data.data.seatInfo || 'General Admission',
            ticketNumber: response.data.data.ticketNumber || `TICKET-${ticketId.value.substring(0, 8)}`,
            price: response.data.data.price || 0,
            status: response.data.data.status || 'ACTIVE',
            purchaseDate: response.data.data.purchaseDate || new Date().toISOString(),
          };
          
          // Default image if not provided
          if (!ticket.value.eventImage) {
            const eventIdNum = parseInt(ticket.value.eventId.replace(/\D/g, '').substring(0, 4), 10) % 5;
            ticket.value.eventImage = `/assets/images/event-${eventIdNum || 0}.png`;
          }
        } else {
          throw new Error(response.data.message || 'Failed to load ticket details');
        }
      } catch (err) {
        console.error('Error fetching ticket details:', err);
        
        // For demo/development: Create mock data if API call fails
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock ticket data for development');
          ticket.value = {
            ticketId: ticketId.value,
            eventId: 'event-12345',
            eventTitle: 'Sample Event Title',
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            venueName: 'Adelaide Town Hall',
            seatInfo: 'Row A - Seat 12',
            ticketNumber: `TICKET-${ticketId.value.substring(0, 8)}`,
            price: 59.99,
            status: 'ACTIVE',
            purchaseDate: new Date().toISOString(),
            bookingId: 'booking-98765',
            eventImage: '/assets/images/event-2.png'
          };
        } else {
          error.value = err.message || 'Failed to load ticket details';
        }
      } finally {
        loading.value = false;
      }
    };
    
    // Download ticket
    const downloadTicket = () => {
      // In a real application, this would call the API to download ticket
      console.log(`Download ticket: ${ticketId.value}`);
      alert('Ticket download feature is under development...');
    };
    
    // Share ticket
    const shareTicket = async () => {
      // Use Web Share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${ticket.value.eventTitle} Ticket`,
            text: `Check out my ticket for ${ticket.value.eventTitle} on ${formatDate(ticket.value.eventDate)}!`,
            url: window.location.href
          });
          console.log('Ticket shared successfully');
        } catch (err) {
          console.error('Error sharing ticket:', err);
          alert('Could not share ticket. Try copying the URL instead.');
        }
      } else {
        // Fallback for browsers that don't support Web Share API
        alert('Share feature is not supported in your browser. Please copy the URL manually.');
      }
    };
    
    onMounted(() => {
      fetchTicketDetails();
    });
    
    return {
      ticketId,
      ticket,
      loading,
      error,
      userName,
      router,
      formatDate,
      formatTime,
      generateQRValue,
      getStatusBadgeClass,
      downloadTicket,
      shareTicket
    };
  }
};
</script>

<style scoped>
.ticket-details-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.back-link {
  font-size: 1.1rem;
  color: #6c757d;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #495057;
}

.ticket-info-card {
  border: none;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 1rem;
}

.ticket-status-badge {
  text-align: center;
}

.ticket-status-badge .badge {
  font-size: 1rem;
  padding: 0.5rem 1.5rem;
  border-radius: 30px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #444;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.ticket-info-section {
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  margin-bottom: 0.8rem;
}

.info-label {
  width: 40%;
  color: #6c757d;
  font-size: 0.95rem;
}

.info-value {
  width: 60%;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.venue-map {
  border-radius: 10px;
  overflow: hidden;
}

.venue-notes {
  font-size: 0.9rem;
  color: #6c757d;
}

.venue-notes ul {
  padding-left: 1.2rem;
}

.venue-notes li {
  margin-bottom: 0.5rem;
}

.contact-info {
  background-color: #e9f7fb;
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
}

.contact-info a {
  text-decoration: none;
  color: #007bff;
}

.contact-info a:hover {
  text-decoration: underline;
}

@media (max-width: 767px) {
  .info-item {
    flex-direction: column;
  }
  
  .info-label,
  .info-value {
    width: 100%;
  }
  
  .info-label {
    margin-bottom: 0.25rem;
  }
}
</style> 