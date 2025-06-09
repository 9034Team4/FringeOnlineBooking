<template>
  <div class="dashboard-page">
    <!-- Summary Cards -->
    <div class="summary-cards">
      <SummaryCard label="Total Users" :value="userStats.totalUsers || '0'" :change="userStats.change || '0'" :percentage="userStats.percentage || '0'" :isUp="userStats.isUp" iconClass="fas fa-users" />
      <SummaryCard label="Total Events" :value="eventStats.totalEvents || '0'" :change="eventStats.change || '0'" :percentage="eventStats.percentage || '0'" :isUp="eventStats.isUp" :color="`#16c2b8`" iconClass="fas fa-calendar-alt" />
      <SummaryCard label="Total Bookings" :value="bookingStats.totalBookings || '0'" :change="bookingStats.change || '0'" :percentage="bookingStats.percentage || '0'" :isUp="bookingStats.isUp" iconClass="fas fa-ticket-alt" />
    </div>

    <!-- Weekly Revenue Chart -->
    <div class="panel" v-if="revenueData.length > 0">
      <h3 class="panel-title">Weekly Revenue (Last 7 Days)</h3>
      <WeeklyRevenueChart :chartData="revenueData" />
    </div>

    <!-- Lower Charts -->
    <div class="chart-grid">
      <div class="panel" v-if="ticketDistribution.length > 0">
        <h3 class="panel-title">Ticket Distribution</h3>
        <PieChart :chartData="ticketDistribution" />
      </div>
      <div class="panel" v-if="trafficData.length > 0">
        <h3 class="panel-title">Traffic Statistics</h3>
        <TrafficBarChart :chartData="trafficData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import SummaryCard from '@/components/dashboard/SummaryCard.vue'
import WeeklyRevenueChart from '@/components/dashboard/WeeklyRevenueChart.vue'
import PieChart from '@/components/dashboard/PieChart.vue'
import TrafficBarChart from '@/components/dashboard/TrafficBarChart.vue'

// Initialize data
const userStats = ref({
  totalUsers: '0',
  change: '0',
  percentage: '0',
  isUp: true
})

const eventStats = ref({
  totalEvents: '0',
  change: '0',
  percentage: '0',
  isUp: true
})

const bookingStats = ref({
  totalBookings: '0',
  change: '0',
  percentage: '0',
  isUp: true
})

const revenueData = ref([])
const ticketDistribution = ref([])
const trafficData = ref([])

// Fetch all dashboard statistics
const fetchDashboardStats = async () => {
  try {
    // Get user statistics
    const usersResponse = await axios.get('http://localhost:3000/api/admin/stats/users')
    if (usersResponse.data && usersResponse.data.success) {
      userStats.value = {
        totalUsers: formatNumber(usersResponse.data.data.total),
        change: usersResponse.data.data.change,
        percentage: usersResponse.data.data.percentage,
        isUp: usersResponse.data.data.trend === 'up'
      }
    }

    // Get event statistics
    const eventsResponse = await axios.get('http://localhost:3000/api/admin/stats/events')
    if (eventsResponse.data && eventsResponse.data.success) {
      eventStats.value = {
        totalEvents: formatNumber(eventsResponse.data.data.total),
        change: eventsResponse.data.data.change,
        percentage: eventsResponse.data.data.percentage,
        isUp: eventsResponse.data.data.trend === 'up'
      }
    }

    // Get booking statistics
    const bookingsResponse = await axios.get('http://localhost:3000/api/admin/stats/bookings')
    if (bookingsResponse.data && bookingsResponse.data.success) {
      bookingStats.value = {
        totalBookings: formatNumber(bookingsResponse.data.data.total),
        change: bookingsResponse.data.data.change,
        percentage: bookingsResponse.data.data.percentage,
        isUp: bookingsResponse.data.data.trend === 'up'
      }
    }

    // Get revenue statistics
    const revenueResponse = await axios.get('http://localhost:3000/api/admin/stats/revenue')
    if (revenueResponse.data && revenueResponse.data.success) {
      revenueData.value = revenueResponse.data.data
    }

    // Get ticket distribution
    const ticketResponse = await axios.get('http://localhost:3000/api/admin/stats/ticket-distribution')
    if (ticketResponse.data && ticketResponse.data.success) {
      ticketDistribution.value = ticketResponse.data.data
    }

    // Get traffic statistics
    const trafficResponse = await axios.get('http://localhost:3000/api/admin/stats/traffic')
    if (trafficResponse.data && trafficResponse.data.success) {
      trafficData.value = trafficResponse.data.data
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

// Format numbers (e.g., 1000 -> 1K)
const formatNumber = (num) => {
  if (!num) return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Fetch data when component is mounted
onMounted(() => {
  // Get token
  const token = localStorage.getItem('token')
  if (token) {
    // Set request headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    // Fetch statistics
    fetchDashboardStats()
  }
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-cards {
  flex: 1;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 16px;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 16px;
  margin-bottom: 16px;
  color: #333;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
</style>
