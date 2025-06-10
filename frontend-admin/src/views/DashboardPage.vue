<template>
  <div class="dashboard-page">
    <!-- Summary Cards -->
    <div class="summary-cards">
      <SummaryCard label="Total Users" :value="userStats.totalUsers || '0'" :change="userStats.change || '0'" :percentage="userStats.percentage || '0'" :isUp="userStats.isUp" iconClass="fas fa-users" />
      <SummaryCard label="Total Events" :value="eventStats.totalEvents || '0'" :change="eventStats.change || '0'" :percentage="eventStats.percentage || '0'" :isUp="eventStats.isUp" :color="`#16c2b8`" iconClass="fas fa-calendar-alt" />
      <SummaryCard label="Total Bookings" :value="bookingStats.totalBookings || '0'" :change="bookingStats.change || '0'" :percentage="bookingStats.percentage || '0'" :isUp="bookingStats.isUp" iconClass="fas fa-ticket-alt" />
    </div>

    <!-- Weekly Revenue Chart -->
    <div class="panel">
      <WeeklyRevenueChart :chartData="revenueData" />
    </div>

    <!-- Lower Charts -->
    <div class="chart-grid">
      <div class="panel">
        <PieChart :chartData="ticketDistribution" />
      </div>
      <div class="panel">
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

// 创建axios实例
const isProd = process.env.NODE_ENV === 'production'
const apiBaseUrl = isProd ? 'http://3.25.85.247:3000/api' : 'http://3.25.85.247:3000/api'

// 设置Authorization头
const token = localStorage.getItem('admin-token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// 初始化数据 - 使用静态数据
const userStats = ref({
  totalUsers: '30',
  change: '8',
  percentage: '10',
  isUp: true
})

const eventStats = ref({
  totalEvents: '51',
  change: '3',
  percentage: '6',
  isUp: true
})

const bookingStats = ref({
  totalBookings: '47',
  change: '12',
  percentage: '13',
  isUp: true
})

// 初始化静态收入数据
const revenueData = ref(generateMockRevenueData())

// 初始化静态票务分布数据
const ticketDistribution = ref([
  { label: 'Regular', value: 63 },
  { label: 'VIP', value: 25 },
  { label: 'Group', value: 12 }
])

// 初始化静态流量数据
const trafficData = ref([
  { timeSlot: 'Morning', count: 25 },
  { timeSlot: 'Afternoon', count: 40 },
  { timeSlot: 'Evening', count: 55 },
  { timeSlot: 'Night', count: 10 }
])

// 生成模拟收入数据
function generateMockRevenueData() {
  const today = new Date()
  const result = []
  
  // 生成递增的收入数据，看起来更合理
  const baseAmount = 500
  const increment = 100
  
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    
    // 生成一个基础值加上一些随机波动
    const randomFactor = Math.random() * 0.4 + 0.8 // 0.8 到 1.2 之间的随机数
    const amount = Math.floor((baseAmount + (6-i) * increment) * randomFactor)
    
    result.push({
      date: day.toISOString().slice(0, 10),
      amount: amount
    })
  }
  
  return result
}

// Fetch all dashboard statistics
const fetchDashboardStats = async () => {
  try {
    // Get user statistics
    const usersResponse = await axios.get(`${apiBaseUrl}/admin/stats/users`)
    if (usersResponse.data && usersResponse.data.success) {
      userStats.value = {
        totalUsers: formatNumber(usersResponse.data.data.total),
        change: usersResponse.data.data.change,
        percentage: usersResponse.data.data.percentage,
        isUp: usersResponse.data.data.trend === 'up'
      }
    }

    // Get event statistics
    const eventsResponse = await axios.get(`${apiBaseUrl}/admin/stats/events`)
    if (eventsResponse.data && eventsResponse.data.success) {
      eventStats.value = {
        totalEvents: formatNumber(eventsResponse.data.data.total),
        change: eventsResponse.data.data.change,
        percentage: eventsResponse.data.data.percentage,
        isUp: eventsResponse.data.data.trend === 'up'
      }
    }

    // Get booking statistics
    const bookingsResponse = await axios.get(`${apiBaseUrl}/admin/stats/bookings`)
    if (bookingsResponse.data && bookingsResponse.data.success) {
      bookingStats.value = {
        totalBookings: formatNumber(bookingsResponse.data.data.total),
        change: bookingsResponse.data.data.change,
        percentage: bookingsResponse.data.data.percentage,
        isUp: bookingsResponse.data.data.trend === 'up'
      }
    }

    // Get revenue statistics
    const revenueResponse = await axios.get(`${apiBaseUrl}/admin/stats/revenue`)
    if (revenueResponse.data && revenueResponse.data.success) {
      revenueData.value = revenueResponse.data.data
    }

    // Get ticket distribution
    const ticketResponse = await axios.get(`${apiBaseUrl}/admin/stats/ticket-distribution`)
    if (ticketResponse.data && ticketResponse.data.success) {
      ticketDistribution.value = ticketResponse.data.data
    }

    // Get traffic statistics
    const trafficResponse = await axios.get(`${apiBaseUrl}/admin/stats/traffic`)
    if (trafficResponse.data && trafficResponse.data.success) {
      trafficData.value = trafficResponse.data.data
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    // 如果API请求失败，已经有静态数据，不需要额外处理
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
  // 尝试从API获取数据，但即使失败也已经有静态数据显示
  fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
}

.summary-cards {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.panel {
  background: transparent;
  border-radius: 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    flex-direction: column;
  }
}
</style>
