<template>
  <div class="chart-card">
    <div class="title-wrapper">
      <h3 class="title">Your Pie Chart</h3>
      <span class="timeframe">Monthly ⌄</span>
    </div>
    <div class="pie-chart-wrapper">
      <Pie :data="pieData" :options="chartOptions" />
    </div>
    <div class="legend">
      <div v-for="(item, index) in legendItems" :key="index" class="legend-item">
        <span class="dot" :style="{ backgroundColor: item.color }"></span>
        {{ item.label }}
        <strong>{{ item.percentage }}%</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  }
})

// 饼图颜色 - 使用更鲜艳的颜色
const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']

// 计算图表数据
const pieData = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        data: [100],
        backgroundColor: ['#f2f2f2'],
        borderWidth: 0
      }]
    }
  }

  const labels = props.chartData.map(item => item.label)
  const data = props.chartData.map(item => item.value)
  const backgroundColors = props.chartData.map((_, index) => colors[index % colors.length])

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: backgroundColors,
      borderWidth: 0
    }]
  }
})

// 计算图例项
const legendItems = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return []
  }

  // 计算总和
  const total = props.chartData.reduce((sum, item) => sum + item.value, 0)

  // 返回带有百分比的图例项
  return props.chartData.map((item, index) => {
    const percentage = Math.round((item.value / total) * 100)
    return {
      label: item.label,
      percentage,
      color: colors[index % colors.length]
    }
  })
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${percentage}%`;
        }
      }
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
  display: flex;
  flex-direction: column;
  user-select: none;
  height: 297px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  user-select: none;
  margin-bottom: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.timeframe {
  font-size: 14px;
  color: #888;
  cursor: pointer;
}

.pie-chart-wrapper {
  height: 170px;
  margin-bottom: 16px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #555;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-basis: 45%;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
