<template>
  <div class="chart-card">
    <div class="title-wrapper">
      <h3 class="title">Weekly Revenue</h3>
      <div class="chart-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3V21H21" stroke="#7D41E1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 15H7V19H5V15Z" fill="#7D41E1"/>
          <path d="M9 11H11V19H9V11Z" fill="#7D41E1"/>
          <path d="M13 7H15V19H13V7Z" fill="#7D41E1"/>
          <path d="M17 3H19V19H17V3Z" fill="#7D41E1"/>
        </svg>
      </div>
    </div>

    <div class="chart-wrapper">
      <Bar :data="chartDataConfig" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  }
})

const labels = computed(() => {
  return props.chartData.map(item => item.date.substring(8, 10)) // 获取日期的天数部分
})

const amounts = computed(() => {
  return props.chartData.map(item => item.amount)
})

// 计算三个层级的数据
const level1Data = computed(() => {
  return amounts.value.map(amount => amount * 0.4) // 40%
})

const level2Data = computed(() => {
  return amounts.value.map(amount => amount * 0.35) // 35%
})

const level3Data = computed(() => {
  return amounts.value.map(amount => amount * 0.25) // 25%
})

const chartDataConfig = computed(() => {
  return {
    labels: labels.value,
    datasets: [
      {
        label: 'Level 1',
        data: level1Data.value,
        backgroundColor: '#7D41E1',
        borderRadius: 6,
        barThickness: 10,
        stack: 'stack1'
      },
      {
        label: 'Level 2',
        data: level2Data.value,
        backgroundColor: '#5EDBFF',
        barThickness: 10,
        borderRadius: 6,
        stack: 'stack1'
      },
      {
        label: 'Level 3',
        data: level3Data.value,
        backgroundColor: '#EAEFFF',
        borderRadius: 6,
        barThickness: 10,
        stack: 'stack1'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
      enabled: true,
      callbacks: {
        label: function(context) {
          const value = context.raw;
          return `$${value.toFixed(2)}`;
        },
        title: function(context) {
          return `Day ${context[0].label}`;
        }
      }
    }
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false }
    },
    y: {
      display: false,
      stacked: true,
      ticks: { display: false },
      grid: { display: false }
    }
  }
}
</script>

<style scoped>
.chart-card {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 297px;
}
.chart-wrapper {
  height: 220px;
  width: 100%;
  position: relative;
  margin-top: 20px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  user-select: none;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.chart-icon {
  width: 24px;
  height: 24px;
}
</style>
