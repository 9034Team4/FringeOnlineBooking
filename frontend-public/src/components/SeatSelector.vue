<template>
  <div class="seat-selector">
    <div class="seat-legend">
      <div class="legend-item">
        <div class="seat-box available"></div>
        <span>Available</span>
      </div>
      <div class="legend-item">
        <div class="seat-box selected"></div>
        <span>Selected</span>
      </div>
      <div class="legend-item">
        <div class="seat-box locked"></div>
        <span>Locked by others</span>
      </div>
      <div class="legend-item">
        <div class="seat-box booked"></div>
        <span>Booked</span>
      </div>
    </div>

    <div class="stage-area">
      <div class="stage">STAGE</div>
    </div>

    <div class="seating-area" ref="seatingArea">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="seat-grid">
        <div v-for="row in rows" :key="row" class="seat-row">
          <div class="row-label">{{ row }}</div>
          <div
            v-for="seat in getSeatsInRow(row)"
            :key="seat.id"
            class="seat"
            :class="{
              'available': seat.status === 'available',
              'locked': seat.status === 'locked' && !isSelectedBySelf(seat.id),
              'booked': seat.status === 'booked',
              'selected': isSelectedBySelf(seat.id),
              'accessible': seat.isAccessible
            }"
            @click="toggleSeatSelection(seat)"
          >
            {{ seat.seatNumber }}
            <div v-if="seat.status === 'locked' && seat.remainingLockTime" class="lock-timer">
              {{ formatRemainingTime(seat.remainingLockTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="selected-seats-info">
      <h4>Selected Seats: {{ selectedSeats.length }}</h4>
      <div class="selected-seats-list">
        <div v-for="seat in selectedSeats" :key="seat.id" class="selected-seat-item">
          Row {{ seat.row }} - Seat {{ seat.seatNumber }}
          <span class="seat-price">${{ seat.price.toFixed(2) }}</span>
        </div>
      </div>
      <div class="total-price" v-if="selectedSeats.length > 0">
        Total: ${{ totalPrice.toFixed(2) }}
      </div>
      <button
        class="btn btn-primary"
        :disabled="selectedSeats.length === 0 || isLocking"
        @click="lockSelectedSeats"
      >
        {{ isLocking ? 'Locking...' : 'Continue to Payment' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'SeatSelector',
  props: {
    eventId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    
    const seats = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const selectedSeatIds = ref([]);
    const isLocking = ref(false);
    const refreshInterval = ref(null);
    
    // Get all unique rows from seats
    const rows = computed(() => {
      const uniqueRows = [...new Set(seats.value.map(seat => seat.row))];
      return uniqueRows.sort();
    });
    
    // Get selected seats objects
    const selectedSeats = computed(() => {
      return seats.value.filter(seat => selectedSeatIds.value.includes(seat.id));
    });
    
    // Calculate total price
    const totalPrice = computed(() => {
      return selectedSeats.value.reduce((total, seat) => total + seat.price, 0);
    });
    
    // Get seats in a specific row
    const getSeatsInRow = (row) => {
      return seats.value.filter(seat => seat.row === row)
        .sort((a, b) => {
          // Numeric sort if seatNumber is a number
          const numA = parseInt(a.seatNumber);
          const numB = parseInt(b.seatNumber);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          // Otherwise sort as strings
          return a.seatNumber.localeCompare(b.seatNumber);
        });
    };
    
    // Check if a seat is selected by the current user
    const isSelectedBySelf = (seatId) => {
      return selectedSeatIds.value.includes(seatId);
    };
    
    // Toggle seat selection
    const toggleSeatSelection = (seat) => {
      if (seat.status !== 'available' && !isSelectedBySelf(seat.id)) {
        return; // Can't select locked or booked seats
      }
      
      const index = selectedSeatIds.value.indexOf(seat.id);
      if (index === -1) {
        selectedSeatIds.value.push(seat.id);
      } else {
        selectedSeatIds.value.splice(index, 1);
      }
    };
    
    // Format remaining lock time (seconds) to MM:SS
    const formatRemainingTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    // Fetch available seats
    const fetchAvailableSeats = async () => {
      try {
        loading.value = true;
        const response = await axios.get(`/api/events/${props.eventId}/seats`);
        if (response.data.success) {
          seats.value = response.data.data;
        } else {
          error.value = response.data.message;
        }
      } catch (err) {
        error.value = err.message || 'Failed to fetch seats';
      } finally {
        loading.value = false;
      }
    };
    
    // Fetch seat lock status for all seats
    const fetchSeatLockStatus = async () => {
      if (seats.value.length === 0) return;
      
      try {
        const seatIds = seats.value.map(seat => seat.id).join(',');
        const response = await axios.get(`/api/seats/lock-status?eventId=${props.eventId}&seatIds=${seatIds}`);
        
        if (response.data.success) {
          // Update seat statuses
          const statusMap = response.data.data.reduce((map, statusItem) => {
            map[statusItem.id] = statusItem;
            return map;
          }, {});
          
          // Update each seat with its current status
          seats.value = seats.value.map(seat => {
            const status = statusMap[seat.id];
            if (status) {
              return { ...seat, ...status };
            }
            return seat;
          });
        }
      } catch (err) {
        console.error('Failed to fetch seat status:', err);
      }
    };
    
    // Lock selected seats
    const lockSelectedSeats = async () => {
      if (!authStore.isAuthenticated) {
        // Redirect to login
        router.push({ 
          name: 'login', 
          query: { 
            redirect: route.fullPath,
            action: 'seat-selection', 
            seats: selectedSeatIds.value.join(','),
            event: props.eventId
          } 
        });
        return;
      }
      
      if (selectedSeatIds.value.length === 0) return;
      
      try {
        isLocking.value = true;
        
        const response = await axios.post('/api/seats/lock', {
          eventId: props.eventId,
          seatIds: selectedSeatIds.value
        });
        
        if (response.data.success) {
          // Redirect to payment page
          router.push({
            name: 'payment',
            params: { eventId: props.eventId },
            query: { seats: selectedSeatIds.value.join(',') }
          });
        } else {
          error.value = response.data.message;
        }
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to lock seats';
      } finally {
        isLocking.value = false;
      }
    };
    
    // Release user's locked seats when navigating away
    const releaseUserLockedSeats = async () => {
      if (selectedSeatIds.value.length === 0 || !authStore.isAuthenticated) return;
      
      try {
        await axios.post('/api/seats/release-locks', {
          eventId: props.eventId,
          seatIds: selectedSeatIds.value
        });
      } catch (err) {
        console.error('Failed to release seats:', err);
      }
    };
    
    // Initialize
    onMounted(async () => {
      await fetchAvailableSeats();
      
      // Set up periodic refresh for seat status
      refreshInterval.value = setInterval(fetchSeatLockStatus, 10000); // Every 10 seconds
    });
    
    // Clean up
    onBeforeUnmount(() => {
      clearInterval(refreshInterval.value);
      releaseUserLockedSeats();
    });
    
    // Reactively fetch new seat status when event ID changes
    watch(() => props.eventId, async () => {
      selectedSeatIds.value = [];
      await fetchAvailableSeats();
    });
    
    return {
      seats,
      loading,
      error,
      rows,
      selectedSeatIds,
      selectedSeats,
      totalPrice,
      isLocking,
      getSeatsInRow,
      isSelectedBySelf,
      toggleSeatSelection,
      lockSelectedSeats,
      formatRemainingTime
    };
  }
};
</script>

<style scoped>
.seat-selector {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.seat-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seat-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.seat-box.available {
  background-color: #28a745;
  border: 1px solid #218838;
}

.seat-box.selected {
  background-color: #007bff;
  border: 1px solid #0069d9;
}

.seat-box.locked {
  background-color: #dc3545;
  border: 1px solid #c82333;
}

.seat-box.booked {
  background-color: #6c757d;
  border: 1px solid #5a6268;
}

.stage-area {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.stage {
  width: 80%;
  padding: 1rem;
  text-align: center;
  background-color: #e9ecef;
  border-radius: 8px;
  font-weight: bold;
}

.seating-area {
  position: relative;
  overflow-x: auto;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.seat-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.row-label {
  width: 30px;
  text-align: center;
  font-weight: bold;
}

.seat {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

.seat.available {
  background-color: #28a745;
  color: white;
}

.seat.available:hover {
  background-color: #218838;
  transform: scale(1.05);
}

.seat.selected {
  background-color: #007bff;
  color: white;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #007bff;
}

.seat.locked {
  background-color: #dc3545;
  color: white;
  cursor: not-allowed;
}

.seat.booked {
  background-color: #6c757d;
  color: white;
  cursor: not-allowed;
}

.seat.accessible::after {
  content: '♿';
  position: absolute;
  bottom: -15px;
  font-size: 10px;
}

.lock-timer {
  position: absolute;
  bottom: -18px;
  font-size: 10px;
  color: #dc3545;
  font-weight: bold;
}

.selected-seats-info {
  border-top: 1px solid #dee2e6;
  padding-top: 1.5rem;
}

.selected-seats-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.selected-seat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: #e9ecef;
  border-radius: 4px;
}

.seat-price {
  font-weight: bold;
}

.total-price {
  font-size: 1.25rem;
  font-weight: bold;
  text-align: right;
  margin: 1rem 0;
}

button {
  width: 100%;
  padding: 0.75rem;
}
</style> 