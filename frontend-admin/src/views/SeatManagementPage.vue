<template>
  <div class="seat-management-page">
    <div class="page-header">
      <h1>座位管理</h1>
      <div class="header-actions">
        <button 
          class="btn btn-outline-primary" 
          @click="refreshSeats"
          :disabled="loading"
        >
          <i class="bi bi-arrow-clockwise"></i> 刷新
        </button>
        <button 
          class="btn btn-danger" 
          @click="releaseExpiredLocks"
          :disabled="loading || releasing"
        >
          <i class="bi bi-unlock"></i> 释放过期锁定
        </button>
      </div>
    </div>
    
    <div class="filters-section card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="venueSelect" class="form-label">场馆</label>
            <select 
              id="venueSelect" 
              class="form-select" 
              v-model="selectedVenueId"
              @change="loadEvents"
            >
              <option value="">选择场馆</option>
              <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                {{ venue.name }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4">
            <label for="eventSelect" class="form-label">活动</label>
            <select 
              id="eventSelect" 
              class="form-select" 
              v-model="selectedEventId"
              @change="loadSeats"
              :disabled="!selectedVenueId"
            >
              <option value="">选择活动</option>
              <option v-for="event in events" :key="event.id" :value="event.id">
                {{ event.title }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4">
            <label for="statusFilter" class="form-label">状态筛选</label>
            <select id="statusFilter" class="form-select" v-model="statusFilter">
              <option value="all">全部</option>
              <option value="available">可用</option>
              <option value="locked">已锁定</option>
              <option value="booked">已预订</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-8">
        <div class="seat-view-card card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">座位视图</h5>
            <div class="legend">
              <span class="legend-item">
                <span class="status-dot available"></span> 可用
              </span>
              <span class="legend-item">
                <span class="status-dot locked"></span> 已锁定
              </span>
              <span class="legend-item">
                <span class="status-dot booked"></span> 已预订
              </span>
            </div>
          </div>
          
          <div class="card-body">
            <div v-if="loading" class="text-center my-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-3">正在加载座位信息...</p>
            </div>
            
            <div v-else-if="!selectedEventId" class="text-center my-5">
              <i class="bi bi-arrow-up-circle fs-1 text-muted"></i>
              <p class="mt-3">请选择场馆和活动以查看座位</p>
            </div>
            
            <div v-else-if="filteredSeats.length === 0" class="text-center my-5">
              <i class="bi bi-search fs-1 text-muted"></i>
              <p class="mt-3">未找到符合条件的座位</p>
            </div>
            
            <div v-else class="seat-grid-container">
              <div class="stage-area">
                <div class="stage">舞台</div>
              </div>
              
              <div class="seat-grid">
                <div v-for="row in seatRows" :key="row" class="seat-row">
                  <div class="row-label">{{ row }}</div>
                  <div 
                    v-for="seat in getSeatsInRow(row)" 
                    :key="seat.id"
                    class="seat"
                    :class="getSeatStatusClass(seat)"
                    @click="selectSeat(seat)"
                  >
                    {{ seat.seatNumber }}
                    <div v-if="seat.status === 'locked' && seat.remainingLockTime" class="lock-timer">
                      {{ formatRemainingTime(seat.remainingLockTime) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">座位统计</h5>
          </div>
          <div class="card-body">
            <div class="stats-item">
              <div class="label">总座位数</div>
              <div class="value">{{ seats.length }}</div>
            </div>
            <div class="stats-item">
              <div class="label">可用座位</div>
              <div class="value">{{ getStatusCount('available') }}</div>
            </div>
            <div class="stats-item">
              <div class="label">锁定座位</div>
              <div class="value">{{ getStatusCount('locked') }}</div>
            </div>
            <div class="stats-item">
              <div class="label">已预订座位</div>
              <div class="value">{{ getStatusCount('booked') }}</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">座位详情</h5>
          </div>
          <div class="card-body">
            <div v-if="!selectedSeat">
              <p class="text-center text-muted">选择一个座位以查看详情</p>
            </div>
            <div v-else>
              <h6 class="mb-3">座位 {{ selectedSeat.row }}-{{ selectedSeat.seatNumber }}</h6>
              
              <div class="detail-item">
                <div class="label">ID:</div>
                <div class="value">{{ selectedSeat.id }}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">区域:</div>
                <div class="value">{{ selectedSeat.section || '默认区域' }}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">价格:</div>
                <div class="value">${{ selectedSeat.price?.toFixed(2) }}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">状态:</div>
                <div class="value">
                  <span class="status-badge" :class="getSeatStatusClass(selectedSeat)">
                    {{ getSeatStatusText(selectedSeat.status) }}
                  </span>
                </div>
              </div>
              
              <div v-if="selectedSeat.status === 'locked'" class="detail-item">
                <div class="label">锁定用户:</div>
                <div class="value">{{ getUserName(selectedSeat.lockBy) }}</div>
              </div>
              
              <div v-if="selectedSeat.status === 'locked'" class="detail-item">
                <div class="label">锁定时间:</div>
                <div class="value">{{ formatDateTime(selectedSeat.lockTime) }}</div>
              </div>
              
              <div v-if="selectedSeat.status === 'locked' && selectedSeat.remainingLockTime" class="detail-item">
                <div class="label">剩余时间:</div>
                <div class="value">{{ formatRemainingTime(selectedSeat.remainingLockTime) }}</div>
              </div>
              
              <div class="mt-3">
                <button 
                  v-if="selectedSeat.status === 'locked'"
                  class="btn btn-warning btn-sm w-100"
                  @click="releaseSeatLock(selectedSeat)"
                  :disabled="releasing"
                >
                  手动释放锁定
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
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';

export default {
  name: 'SeatManagementPage',
  setup() {
    const venues = ref([]);
    const events = ref([]);
    const seats = ref([]);
    const selectedVenueId = ref('');
    const selectedEventId = ref('');
    const statusFilter = ref('all');
    const selectedSeat = ref(null);
    const loading = ref(false);
    const releasing = ref(false);
    const users = ref({});
    const refreshTimer = ref(null);
    
    // Get unique rows from the seats
    const seatRows = computed(() => {
      const rows = [...new Set(filteredSeats.value.map(seat => seat.row))];
      return rows.sort();
    });
    
    // Filter seats by status
    const filteredSeats = computed(() => {
      if (statusFilter.value === 'all') {
        return seats.value;
      }
      return seats.value.filter(seat => seat.status === statusFilter.value);
    });
    
    // Get seats in a specific row
    const getSeatsInRow = (row) => {
      return filteredSeats.value
        .filter(seat => seat.row === row)
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
    
    // Get class based on seat status
    const getSeatStatusClass = (seat) => {
      return {
        'available': seat.status === 'available',
        'locked': seat.status === 'locked',
        'booked': seat.status === 'booked'
      };
    };
    
    // Get text representation of status
    const getSeatStatusText = (status) => {
      switch (status) {
        case 'available': return '可用';
        case 'locked': return '已锁定';
        case 'booked': return '已预订';
        default: return status;
      }
    };
    
    // Format remaining lock time
    const formatRemainingTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    // Format date and time
    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    };
    
    // Get user's name by ID
    const getUserName = (userId) => {
      if (!userId) return '-';
      return users.value[userId]?.name || `用户 ${userId}`;
    };
    
    // Count seats by status
    const getStatusCount = (status) => {
      return seats.value.filter(seat => seat.status === status).length;
    };
    
    // Select a seat to view details
    const selectSeat = (seat) => {
      selectedSeat.value = seat;
    };
    
    // Load venues
    const loadVenues = async () => {
      try {
        const response = await axios.get('/api/admin/venues');
        if (response.data.success) {
          venues.value = response.data.data;
        }
      } catch (err) {
        console.error('Failed to load venues:', err);
      }
    };
    
    // Load events for a venue
    const loadEvents = async () => {
      if (!selectedVenueId.value) {
        events.value = [];
        selectedEventId.value = '';
        return;
      }
      
      try {
        loading.value = true;
        const response = await axios.get(`/api/admin/venues/${selectedVenueId.value}/events`);
        if (response.data.success) {
          events.value = response.data.data;
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Load seats for an event
    const loadSeats = async () => {
      if (!selectedEventId.value) {
        seats.value = [];
        return;
      }
      
      try {
        loading.value = true;
        const response = await axios.get(`/api/events/${selectedEventId.value}/seats`);
        if (response.data.success) {
          seats.value = response.data.data;
          
          // Update seat statuses with lock information
          await fetchSeatLockStatus();
        }
      } catch (err) {
        console.error('Failed to load seats:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Fetch seat lock status
    const fetchSeatLockStatus = async () => {
      if (seats.value.length === 0 || !selectedEventId.value) return;
      
      try {
        const seatIds = seats.value.map(seat => seat.id).join(',');
        const response = await axios.get(`/api/seats/lock-status?eventId=${selectedEventId.value}&seatIds=${seatIds}`);
        
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
          
          // Update selected seat if it exists
          if (selectedSeat.value) {
            const updatedSeat = seats.value.find(s => s.id === selectedSeat.value.id);
            if (updatedSeat) {
              selectedSeat.value = updatedSeat;
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch seat status:', err);
      }
    };
    
    // Release expired seat locks
    const releaseExpiredLocks = async () => {
      try {
        releasing.value = true;
        const response = await axios.post('/api/admin/seats/release-expired');
        
        if (response.data.success) {
          // Refresh seats after releasing
          await loadSeats();
          
          const count = response.data.data.count;
          alert(`成功释放 ${count} 个过期锁定的座位`);
        }
      } catch (err) {
        console.error('Failed to release expired locks:', err);
        alert('释放过期锁定失败');
      } finally {
        releasing.value = false;
      }
    };
    
    // Release a specific seat lock
    const releaseSeatLock = async (seat) => {
      if (!seat || seat.status !== 'locked') return;
      
      if (!confirm(`确定要释放座位 ${seat.row}-${seat.seatNumber} 的锁定吗？`)) {
        return;
      }
      
      try {
        releasing.value = true;
        // In a real application, you'd have an admin-specific endpoint for this
        // Here we're using the same endpoint used for regular user releases
        const response = await axios.post('/api/admin/seats/release', {
          eventId: selectedEventId.value,
          seatIds: [seat.id]
        });
        
        if (response.data.success) {
          // Refresh seats after releasing
          await loadSeats();
          alert('座位锁定已释放');
        }
      } catch (err) {
        console.error('Failed to release seat lock:', err);
        alert('释放座位锁定失败');
      } finally {
        releasing.value = false;
      }
    };
    
    // Manually refresh seats
    const refreshSeats = async () => {
      await loadSeats();
    };
    
    // Setup auto-refresh
    const setupAutoRefresh = () => {
      // Clear any existing timer
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value);
      }
      
      // Set up a new timer
      refreshTimer.value = setInterval(() => {
        if (selectedEventId.value) {
          fetchSeatLockStatus();
        }
      }, 30000); // Refresh every 30 seconds
    };
    
    // Load users (simplified)
    const loadUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        if (response.data.success) {
          // Convert array to map for easy lookup
          users.value = response.data.data.reduce((map, user) => {
            map[user.id] = user;
            return map;
          }, {});
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    
    // Watchers
    watch(selectedVenueId, () => {
      loadEvents();
    });
    
    watch(selectedEventId, () => {
      loadSeats();
    });
    
    // Lifecycle hooks
    onMounted(() => {
      loadVenues();
      loadUsers();
      setupAutoRefresh();
    });
    
    return {
      venues,
      events,
      seats,
      selectedVenueId,
      selectedEventId,
      statusFilter,
      selectedSeat,
      loading,
      releasing,
      seatRows,
      filteredSeats,
      getSeatsInRow,
      getSeatStatusClass,
      getSeatStatusText,
      formatRemainingTime,
      formatDateTime,
      getUserName,
      getStatusCount,
      selectSeat,
      releaseExpiredLocks,
      releaseSeatLock,
      refreshSeats
    };
  }
};
</script>

<style scoped>
.seat-management-page {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.card {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.seat-view-card {
  min-height: 600px;
}

.legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.available {
  background-color: #28a745;
}

.status-dot.locked {
  background-color: #ffc107;
}

.status-dot.booked {
  background-color: #dc3545;
}

.seat-grid-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stage-area {
  display: flex;
  justify-content: center;
}

.stage {
  width: 60%;
  background-color: #6c757d;
  color: white;
  padding: 0.5rem;
  text-align: center;
  border-radius: 4px;
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
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.seat.available {
  background-color: #28a745;
  color: white;
}

.seat.locked {
  background-color: #ffc107;
  color: #212529;
}

.seat.booked {
  background-color: #dc3545;
  color: white;
}

.seat:hover {
  transform: scale(1.1);
  z-index: 1;
}

.lock-timer {
  position: absolute;
  bottom: -15px;
  font-size: 9px;
  color: #dc3545;
  font-weight: bold;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.stats-item:last-child {
  border-bottom: none;
}

.stats-item .value {
  font-weight: bold;
}

.detail-item {
  display: flex;
  margin-bottom: 0.75rem;
}

.detail-item .label {
  width: 100px;
  font-weight: bold;
  color: #6c757d;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  color: white;
}

.status-badge.available {
  background-color: #28a745;
}

.status-badge.locked {
  background-color: #ffc107;
  color: #212529;
}

.status-badge.booked {
  background-color: #dc3545;
}
</style> 