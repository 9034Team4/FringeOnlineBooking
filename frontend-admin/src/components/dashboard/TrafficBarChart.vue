<template>
  <div class="chart-card">
    <div class="header">
      <div class="info">
        <span class="label">Daily Traffic</span>
        <div class="value">
          {{ totalVisitors }} <span class="unit">Visitors</span>
        </div>
      </div>
      <div class="percentage" :class="{ up: isUp, down: !isUp }">
        {{ changePercentage }}
      </div>
    </div>
    <div class="bar-wrapper">
      <Bar :data="chartDataConfig" :options="chartOptions" class="bar" />
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  }
})

// 计算访问者总数
const totalVisitors = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    return '0';
  }
  
  const total = props.chartData.reduce((sum, item) => sum + item.count, 0);
  return total.toLocaleString(); // 格式化数字，添加千位分隔符
});

// 模拟变化百分比（实际项目中可能需要从后端获取）
const isUp = computed(() => {
  // 随机生成一个布尔值，70%概率为true（增长）
  return Math.random() > 0.3;
});

const changePercentage = computed(() => {
  // 生成一个1-5之间的随机数，保留两位小数
  const percentage = (Math.random() * 4 + 1).toFixed(2);
  return (isUp.value ? '+' : '-') + percentage + '%';
});

// 计算图表数据
const chartDataConfig = computed(() => {
  if (!props.chartData || props.chartData.length === 0) {
    // 默认数据
    return {
      labels: ['00', '04', '08', '12', '14', '16', '18'],
      datasets: [{
        label: 'Visitors',
        data: [8, 5, 12, 9, 11, 15, 4],
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
          gradient.addColorStop(0, '#7d41e1')  // 顶部：紫色
          gradient.addColorStop(1, '#f25c94')  // 底部：粉色
          return gradient
        },
        borderRadius: 6,
        barThickness: 24
      }]
    };
  }
  
  return {
    labels: props.chartData.map(item => item.timeSlot),
    datasets: [{
      label: 'Visitors',
      data: props.chartData.map(item => item.count),
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
        gradient.addColorStop(0, '#7d41e1')  // 顶部：紫色
        gradient.addColorStop(1, '#f25c94')  // 底部：粉色
        return gradient
      },
      borderRadius: 6,
      barThickness: 24
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
      enabled: true,
      callbacks: {
        label: function(context) {
          return `${context.raw} visitors`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#888',
        font: { size: 12 }
      }
    },
    y: {
      display: false,
      grid: { display: false },
      ticks: { display: false }
    }
  }
};
</script>

<style scoped>
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: 297px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.info {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}

.value {
  font-size: 24px;
  font-weight: 600;
  color: #2d2d2d;
}

.unit {
  font-size: 14px;
  color: #888;
  margin-left: 6px;
}

.percentage {
  font-size: 13px;
  font-weight: 500;
}

.percentage.up {
  color: #18c964;
}

.percentage.down {
  color: #f31260;
}

.bar-wrapper {
  flex: 1;
  position: relative;
}
</style>
