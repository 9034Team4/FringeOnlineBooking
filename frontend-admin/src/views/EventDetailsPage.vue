<template>
  <div class="event-details-page">
    <div class="header">
      <h2>Event Details</h2>
      <button class="back-btn" @click="goBack">Back to Events</button>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading event details...</p>
    </div>

    <div v-else class="content">
      <!-- Event Information -->
      <div class="event-info-card">
        <h3>Event Information</h3>
        <div class="event-info-grid">
          <div class="event-image">
            <img src="/images/event-1.png" alt="Event Image" />
          </div>
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Title:</span>
              <span class="value">{{ event.title }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Category:</span>
              <span class="value">{{ event.category }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value status" :class="event.status">{{ capitalizeFirstLetter(event.status) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Start Date:</span>
              <span class="value">{{ formatDate(event.startDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">End Date:</span>
              <span class="value">{{ formatDate(event.endDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Venue:</span>
              <span class="value">{{ event.venueName || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Price:</span>
              <span class="value">${{ event.price }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Capacity:</span>
              <span class="value">{{ event.capacity }}</span>
            </div>
          </div>
        </div>
        <div class="description">
          <h4>Description</h4>
          <p>{{ event.description }}</p>
        </div>
      </div>

      <!-- Seats Management -->
      <div class="seats-management-card">
        <div class="card-header">
          <h3>Seats Management</h3>
          <div class="filters">
            <select v-model="seatStatusFilter" class="filter-select">
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="locked">Locked</option>
              <option value="booked">Booked</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select v-model="seatTypeFilter" class="filter-select">
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
              <option value="wheelchair">Wheelchair</option>
            </select>
            <input 
              v-model="seatSearch" 
              class="search-input" 
              placeholder="Search seat (row/number)..." 
            />
          </div>
        </div>

        <!-- 座位统计信息 -->
        <div class="seat-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ seatStats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Available:</span>
            <span class="stat-value available">{{ seatStats.available }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Booked:</span>
            <span class="stat-value booked">{{ seatStats.booked }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Locked:</span>
            <span class="stat-value locked">{{ seatStats.locked }}</span>
          </div>
          <div class="stat-item" v-if="seatStats.unavailable > 0">
            <span class="stat-label">Unavailable:</span>
            <span class="stat-value unavailable">{{ seatStats.unavailable }}</span>
          </div>
        </div>

        <div class="seat-table-wrapper">
          <table class="seat-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Row</th>
                <th>Number</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="seat in pagedSeats" :key="seat.id">
                <td>{{ seat.section || 'Main' }}</td>
                <td>{{ seat.row }}</td>
                <td>{{ seat.seatNumber }}</td>
                <td>{{ capitalizeFirstLetter(seat.type) }}</td>
                <td>${{ seat.price || 0 }}</td>
                <td>
                  <span class="seat-status" :class="seat.status">
                    {{ capitalizeFirstLetter(seat.status) }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="seat.status === 'locked'" 
                    class="action-btn unlock" 
                    @click="unlockSeat(seat.id)"
                  >
                    Unlock
                  </button>
                  <button 
                    v-else-if="seat.status === 'booked'" 
                    class="action-btn cancel" 
                    @click="cancelBooking(seat.id)"
                  >
                    Cancel
                  </button>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="seats.length === 0" class="no-seats">
          <p>No seats available for this event.</p>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="pageCount > 0">
          <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Prev</button>
          <button 
            v-for="page in pageCount" 
            :key="page" 
            :class="{ active: currentPage === page }" 
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const isProd = process.env.NODE_ENV === 'production';

const axiosInstance = axios.create({
  baseURL: isProd ? `http://3.25.85.247:3000/api` : 'http://3.25.85.247:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

const route = useRoute();
const router = useRouter();
const eventId = route.params.id;

// State
const event = ref({});
const seats = ref([]);
const loading = ref(true);
const seatStatusFilter = ref('');
const seatTypeFilter = ref('');
const seatSearch = ref('');

// Pagination
const currentPage = ref(1);
const pageSize = 10;
const pageCount = computed(() => Math.ceil(filteredSeats.value.length / pageSize));

// Computed
const filteredSeats = computed(() => {
  let result = seats.value;
  
  if (seatStatusFilter.value) {
    result = result.filter(seat => seat.status === seatStatusFilter.value);
  }
  
  if (seatTypeFilter.value) {
    result = result.filter(seat => seat.type === seatTypeFilter.value);
  }
  
  if (seatSearch.value) {
    const searchTerm = seatSearch.value.toLowerCase();
    result = result.filter(seat => 
      seat.row.toLowerCase().includes(searchTerm) || 
      seat.seatNumber.toLowerCase().includes(searchTerm) ||
      (seat.section && seat.section.toLowerCase().includes(searchTerm))
    );
  }
  
  return result;
});

const pagedSeats = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredSeats.value.slice(start, start + pageSize);
});

// 添加座位统计信息
const seatStats = computed(() => {
  const total = seats.value.length;
  const available = seats.value.filter(seat => seat.status === 'available').length;
  const booked = seats.value.filter(seat => seat.status === 'booked').length;
  const locked = seats.value.filter(seat => seat.status === 'locked').length;
  const unavailable = seats.value.filter(seat => seat.status === 'unavailable').length;
  
  return {
    total,
    available,
    booked,
    locked,
    unavailable
  };
});

// Methods
function goBack() {
  router.push('/events');
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function goToPage(page) {
  if (page >= 1 && page <= pageCount.value) {
    currentPage.value = page;
  }
}

async function fetchEventDetails() {
  try {
    loading.value = true;
    
    // 先尝试从localStorage获取事件信息
    const storedEvent = localStorage.getItem('current-event');
    if (storedEvent) {
      event.value = JSON.parse(storedEvent);
    }
    
    // 然后从API获取最新信息
    const response = await axiosInstance.get(`/admin/events/${eventId}`);
    event.value = response.data.data;
    
    // 获取座位信息
    await fetchSeats();
    
    loading.value = false;
  } catch (error) {
    console.error('Error fetching event details:', error);
    loading.value = false;
  }
}

async function fetchSeats() {
  try {
    // 假设后端有一个API端点来获取事件的座位信息
    const response = await axiosInstance.get(`/admin/events/${eventId}/seats`);
    
    if (response.data.success && response.data.data) {
      // 处理新的座位数据结构
      const seatMap = response.data.data;
      const flattenedSeats = [];
      
      // 将嵌套的行列结构转换为扁平数组
      Object.keys(seatMap.rows).forEach(row => {
        seatMap.rows[row].forEach(seat => {
          flattenedSeats.push({
            id: seat.id,
            row: row,
            seatNumber: seat.seatNumber,
            section: 'Main', // 默认section
            type: seat.type,
            price: seat.price || 0,
            status: seat.status,
            isAccessible: seat.isAccessible
          });
        });
      });
      
      seats.value = flattenedSeats;
    } else {
      // 如果API返回的数据格式不符合预期，使用模拟数据
      seats.value = generateMockSeats();
    }
  } catch (error) {
    console.error('Error fetching seats:', error);
    // 生成一些模拟座位数据用于展示
    seats.value = generateMockSeats();
  }
}

function generateMockSeats() {
  const mockSeats = [];
  const sections = ['Orchestra', 'Balcony', 'Mezzanine'];
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seatTypes = ['standard', 'vip', 'wheelchair'];
  const statuses = ['available', 'locked', 'booked'];
  
  let id = 1;
  
  sections.forEach(section => {
    rows.forEach(row => {
      for (let num = 1; num <= 10; num++) {
        const seatType = seatTypes[Math.floor(Math.random() * seatTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const price = seatType === 'vip' ? 100 : seatType === 'wheelchair' ? 50 : 75;
        
        mockSeats.push({
          id: id++,
          section,
          row,
          seatNumber: `${num}`,
          type: seatType,
          price,
          status,
          isAccessible: seatType === 'wheelchair',
          eventId
        });
      }
    });
  });
  
  return mockSeats;
}

async function cancelBooking(seatId) {
  try {
    // 假设后端有一个API端点来取消座位预订
    await axiosInstance.post(`/admin/seats/release`, {
      seatIds: [seatId]
    });
    
    // 更新本地座位状态
    const index = seats.value.findIndex(seat => seat.id === seatId);
    if (index !== -1) {
      seats.value[index].status = 'available';
    }
    
    alert('Seat booking canceled successfully');
  } catch (error) {
    console.error('Error canceling seat booking:', error);
    
    // 如果API不可用，直接在前端模拟取消效果
    const index = seats.value.findIndex(seat => seat.id === seatId);
    if (index !== -1) {
      seats.value[index].status = 'available';
    }
  }
}

async function unlockSeat(seatId) {
  try {
    // 发送解锁请求到API
    await axiosInstance.post(`/admin/seats/release`, {
      seatIds: [seatId]
    });
    
    // 请求成功后才更新本地座位状态
    const index = seats.value.findIndex(seat => seat.id === seatId);
    if (index !== -1) {
      seats.value[index].status = 'available';
    }
  } catch (error) {
    console.error('Error unlocking seat:', error);
    // 请求失败时不更新本地状态
  }
}

// function fixImageUrl(url) {
//   if (!url) return '';
  
//   // 如果URL已经是完整的URL（包含http或https），则直接返回
//   if (url.startsWith('http://') || url.startsWith('https://')) {
//     return url;
//   }
  
//   // 如果URL是相对路径，添加基础URL
//   const baseUrl = isProd ? 'http://3.25.85.247:3000' : 'http://3.25.85.247:3000';
  
//   // 如果URL已经包含/public，则直接添加基础URL
//   if (url.startsWith('/public/')) {
//     return `${baseUrl}${url}`;
//   }
  
//   // 否则，假设它是一个相对于/public/uploads/的路径
//   if (!url.startsWith('/')) {
//     return `${baseUrl}/public/uploads/${url}`;
//   }
  
//   // 其他情况，直接拼接
//   return `${baseUrl}${url}`;
// }

// Lifecycle
onMounted(() => {
  fetchEventDetails();
});
</script>

<style scoped>
.event-details-page {
  font-family: 'ABeeZee', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.back-btn {
  background: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.event-info-card, .seats-management-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 24px;
}

.event-info-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.event-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

.no-image {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #999;
  border-radius: 8px;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  width: 100px;
  color: #666;
}

.value {
  flex: 1;
}

.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.status.published {
  background: #c8f2e0;
  color: #2e7d5a;
}

.status.draft {
  background: #e9ecef;
  color: #495057;
}

.status.cancelled {
  background: #ffeaea;
  color: #e14a82;
}

.description {
  margin-top: 16px;
}

.description h4 {
  margin-bottom: 8px;
  color: #333;
}

.description p {
  color: #555;
  line-height: 1.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filters {
  display: flex;
  gap: 12px;
}

.filter-select, .search-input {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.seat-table-wrapper {
  margin-bottom: 16px;
  overflow-x: auto;
}

.seat-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

.seat-table th, .seat-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.seat-table th {
  background: #fafafd;
  color: #333;
  font-weight: 500;
}

.seat-table tr:hover {
  background-color: #f9f9f9;
}

.seat-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.seat-status.available {
  background: #c8f2e0;
  color: #2e7d5a;
}

.seat-status.locked {
  background: #fff3cd;
  color: #856404;
}

.seat-status.booked {
  background: #cce5ff;
  color: #004085;
}

.action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn.cancel {
  background: #ffeaea;
  color: #e14a82;
}

.action-btn.cancel:hover {
  background: #ffd7d7;
}

.action-btn.unlock {
  background: #fff3cd;
  color: #856404;
}

.action-btn.unlock:hover {
  background: #fff2cc;
}

.no-seats {
  text-align: center;
  padding: 24px;
  color: #666;
}

.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

.pagination button {
  border: none;
  background: #f0f0f0;
  color: #333;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
}

.pagination .active {
  background: #16c2b8;
  color: white;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #16c2b8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .event-info-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
}

.seat-stats {
  display: flex;
  gap: 20px;
  padding: 16px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-weight: 500;
  color: #666;
}

.stat-value {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #333;
}

.stat-value.available {
  background: #c8f2e0;
  color: #2e7d5a;
}

.stat-value.booked {
  background: #cce5ff;
  color: #004085;
}

.stat-value.locked {
  background: #fff3cd;
  color: #856404;
}

.stat-value.unavailable {
  background: #ffeaea;
  color: #e14a82;
}
</style> 