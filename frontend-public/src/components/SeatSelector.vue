<template>
  <div class="wrapper">
    <div class="cinema-wrapper">
      <div class="seat-stats" v-if="seatStats">
        <div class="stat-item">
          <span class="stat-label">Total Seats:</span>
          <span class="stat-value">{{ seatStats.totalSeats }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Available:</span>
          <span class="stat-value">{{ seatStats.availableSeats }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Booked:</span>
          <span class="stat-value">{{ seatStats.bookedSeats }}</span>
        </div>
      </div>
      
      <div class="zoom-controls">
        <button class="zoom-btn" @click="zoomOut" :disabled="seatSize <= 15">-</button>
        <span class="zoom-text">Zoom</span>
        <button class="zoom-btn" @click="zoomIn" :disabled="seatSize >= 30">+</button>
      </div>
      
      <div class="seat-container">
        <div class="seat-wrapper">
          <div class="illustration">
            <div class="illustration-item">
            <div class="illustration-img-wrapper unselected-seat"></div>
            <span class="illustration-text">Available</span>
            </div>
            <div class="illustration-item">
            <div class="illustration-img-wrapper selected-seat"></div>
            <span class="illustration-text">Selected</span>
            </div>
            <div class="illustration-item">
              <div class="illustration-img-wrapper my-locked-seat"></div>
              <span class="illustration-text">My Lock</span>
            </div>
            <div class="illustration-item">
              <div class="illustration-img-wrapper locked-seat"></div>
              <span class="illustration-text">Others' Lock</span>
            </div>
            <div class="illustration-item">
            <div class="illustration-img-wrapper bought-seat"></div>
            <span class="illustration-text">Unavailable</span>
            </div>
          </div>
          <div class="screen">
            STAGE
          </div>
          <div class="screen-center">
            Stage Center
            <div class="mid-line"></div>
          </div>
          <div v-if="loading" class="loading-overlay">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <div class="inner-seat-wrapper" ref="innerSeatWrapper" v-else>
            <div v-for="(row, rowIndex) in seats" :key="`row-${rowIndex}`" class="seat-row">
              <div class="row-label">{{ getRowLabel(rowIndex) }}</div>
              <div v-for="(seat, colIndex) in row" 
                  :key="`seat-${rowIndex}-${colIndex}`"
                  class="seat"
                  :style="{ width: `${seatSize}px`, height: `${seatSize}px` }">
                <div class="inner-seat"
                    @click="handleSeatClick(rowIndex, colIndex)"
                    :class="getSeatClass(seat)">
                    <span class="seat-number" v-if="showSeatNumbers">{{ seat.number }}</span>
                    <span v-if="seat && seat.status === 4" class="unlock-icon" title="Unlock this seat">✕</span>
                </div>
              </div>
              <div class="row-label">{{ getRowLabel(rowIndex) }}</div>
            </div>
          </div>
        </div>
        
        <div class="selected-seats-info" v-if="getSelectedSeats().length > 0">
          <h4>Selected Seats: {{ getSelectedSeats().length }}</h4>
          <div class="selected-seats-list">
            <div v-for="(seat, index) in getSelectedSeats()" :key="index" class="selected-seat-item">
              Row {{ getRowLabel(seat.row) }} - Seat {{ seat.col + 1 }}
              <span class="seat-price">${{ seatPrice.toFixed(2) }}</span>
            </div>
          </div>
          <div class="total-price">
            Total: ${{ (getSelectedSeats().length * seatPrice).toFixed(2) }}
          </div>
          <button
            class="btn-buy full-width"
            :disabled="getSelectedSeats().length === 0 || isLocking"
            @click="proceedToPayment"
          >
            {{ isLocking ? 'Processing...' : 'Continue to Payment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import axiosInstance from '@/api/axiosInstance';

export default {
  name: 'SeatSelector',
  props: {
    eventId: {
      type: String,
      required: true
    },
    event: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const router = useRouter();
    const authStore = useAuthStore();
    const loading = ref(true);
    const error = ref(null);
    const isLocking = ref(false);
    const seatPrice = ref(25.00); // Default seat price
    const innerSeatWrapper = ref(null);
    const seatSize = ref(25); // 默认座位尺寸
    const seatStats = ref(null);
    const showSeatNumbers = ref(true); // 显示座位号
    
    // Number of rows and columns
    const seatRow = ref(12);
    const seatCol = ref(18);
    
    // Seat array with more detailed status
    // status: -1: not a seat, 0: available, 1: selected, 2: booked/unavailable, 3: locked by others, 4: locked by current user
    const seats = ref([]);
    
    // Store current user's lock session ID
    const myLockSessionId = ref(localStorage.getItem('lockSessionId') || '');
    
    // Store seats locked by current user
    const myLockedSeats = ref([]);
    
    // 添加currentUserId变量定义
    let currentUserId = null;
    
    // 获取行标签（A, B, C...）
    const getRowLabel = (rowIndex) => {
      // 如果seats.value[rowIndex]存在且有row属性，使用它
      if (seats.value && seats.value[rowIndex] && seats.value[rowIndex][0] && seats.value[rowIndex][0].row) {
        return seats.value[rowIndex][0].row;
      }
      // 否则使用默认的字母标签
      return String.fromCharCode(65 + rowIndex); // A=65, B=66, ...
    };
    
    // Get seat class based on status
    const getSeatClass = (seat) => {
      if (!seat) return 'unselected-seat';
      
      switch(seat.status) {
        case 1: return 'selected-seat';
        case 2: return 'bought-seat';
        case 3: return 'locked-seat';
        case 4: return 'my-locked-seat';
        default: return 'unselected-seat';
      }
    };
    
    // Initialize seat array
    const initSeatArray = () => {
      const newArray = Array(seatRow.value).fill(0).map(() => 
        Array(seatCol.value).fill(0).map(() => ({ 
          status: 0, 
          lockSessionId: null 
        }))
      );
      seats.value = newArray;
      
      // Calculate seat size
      if (innerSeatWrapper.value) {
        const wrapperWidth = parseInt(window.getComputedStyle(innerSeatWrapper.value).width, 10);
        seatSize.value = Math.min(25, parseInt(wrapperWidth / (seatCol.value + 4), 10));
      }
      
      // Initialize non-seat areas and booked seats
      initNonSeatPlace();
    };
    
    // Initialize non-seat areas and booked seats
    const initNonSeatPlace = () => {
      // 创建类似图像的座位布局
      
      // 设置已售座位（红色）
      const soldSeats = [
        [3, 8], [3, 9], 
        [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10],
        [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12],
        [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9], [6, 16], [6, 17]
      ];
      
      // 设置临时锁定座位（黄色）
      const lockedSeats = [
        [3, 10], [3, 11],
        [4, 11], [4, 12],
        [7, 8], [7, 9]
      ];
      
      soldSeats.forEach(([row, col]) => {
        if (row < seatRow.value && col < seatCol.value) {
          seats.value[row][col].status = 2; // 已售
        }
      });
      
      lockedSeats.forEach(([row, col]) => {
        if (row < seatRow.value && col < seatCol.value) {
          seats.value[row][col].status = 3; // 临时锁定
        }
      });
      
      // 初始化座位统计信息（模拟数据）
      seatStats.value = {
        totalRows: seatRow.value,
        maxColumns: seatCol.value,
        totalSeats: seatRow.value * seatCol.value,
        availableSeats: seatRow.value * seatCol.value - soldSeats.length - lockedSeats.length,
        bookedSeats: soldSeats.length,
        lockedSeats: lockedSeats.length,
        unavailableSeats: 0
      };
    };
    
    // Get selected seats
    const getSelectedSeats = () => {
      if (!seats.value || !Array.isArray(seats.value)) return [];
      
      const selected = [];
      for (let i = 0; i < seatRow.value; i++) {
        for (let j = 0; j < seatCol.value; j++) {
          if (seats.value[i] && 
              Array.isArray(seats.value[i]) && 
              seats.value[i][j] && 
              seats.value[i][j].status === 1) {
            selected.push({ row: i, col: j });
          }
        }
      }
      return selected;
    };
    
    // 在组件加载时检查并获取所有锁定会话ID
    const checkAllLockSessions = () => {
      // 从localStorage获取当前用户的锁定会话ID
      const storedLockSessionId = localStorage.getItem('lockSessionId');
      if (storedLockSessionId) {
        myLockSessionId.value = storedLockSessionId;
      }
      
      // 检查是否有其他锁定会话ID存储在localStorage中
      // 有些应用可能会存储多个锁定会话ID，使用不同的键名
      const allStorageKeys = Object.keys(localStorage);
      const lockSessionKeys = allStorageKeys.filter(key => 
        key.includes('lockSessionId') || key.includes('lockSession')
      );
      
      // 将所有找到的锁定会话ID添加到一个数组中
      const allLockSessions = [];
      if (storedLockSessionId) {
        allLockSessions.push(storedLockSessionId);
      }
      
      lockSessionKeys.forEach(key => {
        const sessionId = localStorage.getItem(key);
        if (sessionId && !allLockSessions.includes(sessionId)) {
          allLockSessions.push(sessionId);
        }
      });
      
      return allLockSessions;
    };
    
    // 检查当前用户是否拥有特定的锁定会话ID
    const isMyLockSession = (lockSessionId) => {
      // 如果没有提供锁定会话ID，返回false
      if (!lockSessionId) return false;
      
      // 如果与当前的myLockSessionId匹配，返回true
      if (lockSessionId === myLockSessionId.value) return true;
      
      // 检查所有可能的锁定会话ID
      const allLockSessions = checkAllLockSessions();
      return allLockSessions.includes(lockSessionId);
    };
    
    // 获取当前用户ID
    const getCurrentUserId = () => {
      if (authStore.isAuthenticated && authStore.user) {
        return authStore.user.id;
          }
      return null;
    };
    
    // Fetch seat data from API
    const fetchSeatData = async () => {
      try {
        loading.value = true;
        
        // 获取当前用户ID，用于检查座位锁定状态
        currentUserId = getCurrentUserId();
        console.log('Current user ID:', currentUserId);
        
        // Update seat price if available
        if (props.event && props.event.basePrice) {
          seatPrice.value = parseFloat(props.event.basePrice);
        }
        
        // Fetch seat data from API
        const response = await axiosInstance.get(`/public/events/${props.eventId}/seats`);
        console.log('Seat data from API:', response.data);
        
        if (response.data.success && response.data.data && response.data.data.rows) {
          // 新的API返回格式是一个对象，包含行作为键
          const rowsData = response.data.data.rows;
          const rowKeys = Object.keys(rowsData).sort(); // 按字母顺序排序行
          
          // 初始化座位数组
          const newSeats = [];
          
          // 处理每一行
          rowKeys.forEach(rowKey => {
            const rowSeats = [];
            const seatsInRow = rowsData[rowKey];
            
            // 处理这一行中的每个座位
            seatsInRow.forEach(seatData => {
              if (seatData) {
                // 将API状态转换为内部状态码
                let statusCode = 0; // 默认可用
                
                if (seatData.status === 'booked') {
                  statusCode = 2; // 已售出
                } else if (seatData.status === 'locked') {
                  // 检查是否是当前用户锁定的
                  if (seatData.lockBy === currentUserId) {
                    statusCode = 4; // 当前用户锁定
                  } else {
                    statusCode = 3; // 其他用户锁定
                  }
                }
                
                rowSeats.push({
                  id: seatData.id,
                  row: rowKey,
                  number: seatData.seatNumber,
                  status: statusCode,
                  type: seatData.type || 'standard',
                  price: parseFloat(seatData.price || props.event?.basePrice || 0),
                  isAccessible: seatData.isAccessible,
                  isSelected: false,
                  lockSessionId: null
                });
              }
            });
            
            newSeats.push(rowSeats);
          });
          
          // 更新座位数组
          seats.value = newSeats;
          
          // 更新行列数量
          seatRow.value = newSeats.length;
          seatCol.value = newSeats.length > 0 ? newSeats[0].length : 0;
          
          console.log('Converted seat array:', seats.value);
          
          // 更新座位统计
          if (response.data.data.stats) {
            seatStats.value = response.data.data.stats;
          } else {
            calculateSeatStats();
          }
          
          // 调整座位大小
          setTimeout(() => {
            adjustSeatSize();
          }, 0);
        } else {
          console.error('Invalid seat data format:', response.data);
          // 如果API返回的数据格式不正确，初始化默认座位
          initSeatArray();
        }
      } catch (error) {
        console.error('Error fetching seat data:', error);
        // 如果API请求失败，初始化默认座位
        initSeatArray();
      } finally {
        loading.value = false;
      }
    };
    
    // 计算座位统计信息
    const calculateSeatStats = () => {
      let available = 0;
      let booked = 0;
      let locked = 0;
      let total = 0;
      
      seats.value.forEach(row => {
        row.forEach(seat => {
          if (seat) {
            total++;
            // API返回的状态是字符串，而我们内部使用的是数字
            if (seat.status === 'available' || seat.status === 0) {
              available++;
            } else if (seat.status === 'booked' || seat.status === 2) {
              booked++;
            } else if (seat.status === 'locked' || seat.status === 3 || seat.status === 4) {
              locked++;
            }
          }
        });
      });
      
      seatStats.value = {
        totalSeats: total,
        availableSeats: available,
        bookedSeats: booked,
        lockedSeats: locked
      };
    };
    
    // 根据场地大小调整座位选择框的大小
    const adjustSeatSize = () => {
      if (!innerSeatWrapper.value) return;
      
      const wrapperWidth = parseInt(window.getComputedStyle(innerSeatWrapper.value).width, 10);
      const wrapperHeight = parseInt(window.getComputedStyle(innerSeatWrapper.value).height, 10);
      
      // 根据行数和列数计算理想的座位大小
      const idealWidthSize = Math.floor(wrapperWidth / (seatCol.value + 2)); // 留出两侧的边距
      const idealHeightSize = Math.floor(wrapperHeight / (seatRow.value + 2)); // 留出上下的边距
      
      // 取较小值确保完全显示
      const idealSize = Math.min(idealWidthSize, idealHeightSize);
      
      // 设置合理的最小和最大尺寸
      seatSize.value = Math.min(Math.max(idealSize, 15), 30);
      
      // 调整后重新检查是否需要滚动条
      setTimeout(() => {
        if (innerSeatWrapper.value) {
          const totalContentHeight = seatRow.value * (seatSize.value + 4); // 座位高度 + 边距
          const containerHeight = parseInt(window.getComputedStyle(innerSeatWrapper.value).height, 10);
          
          // 如果内容高度超过容器高度，稍微减小座位尺寸以避免滚动条
          if (totalContentHeight > containerHeight && seatSize.value > 15) {
            seatSize.value = Math.max(seatSize.value - 2, 15);
          }
        }
      }, 0);
    };
    
    // Proceed to payment
    const proceedToPayment = async () => {
      const selected = getSelectedSeats();
      if (selected.length === 0) return;
      
      // 检查用户是否已登录
      if (!authStore.isAuthenticated) {
        // 保存当前选择的座位信息
        localStorage.setItem('tempSelectedSeats', JSON.stringify(selected.map(seat => ({
          row: seat.row,
          col: seat.col
        }))));
        
        // 保存当前页面路径，用于登录后重定向
        localStorage.setItem('redirectAfterLogin', `/events/${props.eventId}/seats`);
        
        // 跳转到登录页面
        router.push('/login');
        return;
      }
      
      isLocking.value = true;
      
      try {
        // 首先尝试锁定所选座位
        const response = await axiosInstance.post(`/public/events/${props.eventId}/seats/lock`, {
          seats: selected.map(seat => ({
            row: getRowLabel(seat.row), // 转换为字母行号
            seatNumber: seat.number || (seat.col + 1).toString() // 使用座位号或计算座位号
          }))
        });
        
        const result = response.data;
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to lock seats');
        }
        
        // 存储锁定会话ID，用于后续解锁或确认
        localStorage.setItem('lockSessionId', result.data.lockSessionId);
        myLockSessionId.value = result.data.lockSessionId;
        
        // Update seat status to reflect the lock
        const newArray = JSON.parse(JSON.stringify(seats.value));
        selected.forEach(seat => {
          newArray[seat.row][seat.col].status = 4; // My locked seat
          newArray[seat.row][seat.col].lockSessionId = result.data.lockSessionId;
          myLockedSeats.value.push({ row: seat.row, col: seat.col });
        });
        seats.value = newArray;
      
      // Convert selected seats to format suitable for next page
      const seatSelections = selected.map(seat => ({
        row: seat.row + 1,
        seatNumber: seat.number || (seat.col + 1),
        price: seatPrice.value
      }));
      
      // Store selection in localStorage or state management
      localStorage.setItem('selectedSeats', JSON.stringify(seatSelections));
      
      // Navigate to payment page
      router.push({
        name: 'payment',
        params: { eventId: props.eventId }
      });
      } catch (error) {
        console.error('Failed to lock seats:', error);
        alert('Unable to lock selected seats. Please try again or choose different seats.');
      } finally {
        isLocking.value = false;
      }
    };
    
    // 检查是否有之前选择的座位需要恢复
    const restorePreviousSelection = () => {
      const tempSelectedSeats = localStorage.getItem('tempSelectedSeats');
      if (tempSelectedSeats) {
        try {
          const savedSeats = JSON.parse(tempSelectedSeats);
          
          // 恢复之前的选择
          savedSeats.forEach(seat => {
            if (seats.value[seat.row] && 
                seats.value[seat.row][seat.col].status === 0) {
              seats.value[seat.row][seat.col].status = 1; // 设置为已选择
            }
          });
          
          // 清除临时存储
          localStorage.removeItem('tempSelectedSeats');
        } catch (error) {
          console.error('Failed to restore seat selection:', error);
        }
      }
    };
    
    // 缩放控制
    const zoomIn = () => {
      if (seatSize.value < 30) {
        seatSize.value += 2;
      }
    };
    
    const zoomOut = () => {
      if (seatSize.value > 15) {
        seatSize.value -= 2;
      }
    };
    
    // 强制将特定座位标记为"我的锁定"
    const forceMarkAsMyLock = (row, col) => {
      if (!seats.value || 
          !Array.isArray(seats.value) || 
          !seats.value[row] || 
          !Array.isArray(seats.value[row]) || 
          !seats.value[row][col]) {
        console.error('Invalid seat array or seat position');
        return;
      }
      
      const seat = seats.value[row][col];
      if (!seat) return;
      
      if (seat.status === 3) { // 如果是"其他人的锁定"
        console.log(`Forcing seat ${getRowLabel(row)}${col + 1} to be marked as my lock`);
        
        // 创建新数组以保持响应性
        const newArray = JSON.parse(JSON.stringify(seats.value));
        newArray[row][col].status = 4; // 改为"我的锁定"
        
        // 如果这个座位有锁定会话ID，记录下来
        if (newArray[row][col].lockSessionId) {
          myLockSessionId.value = newArray[row][col].lockSessionId;
          localStorage.setItem('lockSessionId', newArray[row][col].lockSessionId);
        }
        
        // 添加到我的锁定座位列表
        myLockedSeats.value.push({
          row,
          col,
          lockSessionId: newArray[row][col].lockSessionId
        });
        
        seats.value = newArray;
      }
    };
    
    // Unlock a seat that was locked by current user
    const unlockSeat = async (row, col) => {
      if (!authStore.isAuthenticated) {
        return; // User not logged in
      }
      
      const seat = seats.value[row][col];
      if (!seat) return;
      
      // 如果座位不是由当前用户锁定的，尝试强制标记为"我的锁定"
      if (seat.status !== 4) {
        forceMarkAsMyLock(row, col);
        // 重新获取座位数据
        const updatedSeat = seats.value[row][col];
        if (updatedSeat.status !== 4) {
          console.error('Cannot unlock seat that is not locked by current user');
          return;
        }
      }
      
      // 获取这个座位的锁定会话ID
      const lockSessionId = seat.lockSessionId || myLockSessionId.value;
      if (!lockSessionId) {
        console.error('No lock session ID found for this seat');
        return;
      }
      
      try {
        console.log(`Attempting to unlock seat ${getRowLabel(row)}${col + 1} with session ID: ${lockSessionId}`);
        
        // 使用axiosInstance替代fetch
        const response = await axiosInstance.post(`/public/events/${props.eventId}/seats/unlock`, {
          lockSessionId: lockSessionId,
          seats: [{
            row: getRowLabel(row),
            seatNumber: (col + 1).toString()
          }]
        });
        
        const result = response.data;
        console.log('Unlock result:', result);
        
        if (result.success) {
          // Update seat status
          const newArray = JSON.parse(JSON.stringify(seats.value));
          newArray[row][col].status = 0; // Available again
          newArray[row][col].lockSessionId = null;
          seats.value = newArray;
          
          // Remove from myLockedSeats
          const index = myLockedSeats.value.findIndex(seat => 
            seat.row === row && seat.col === col
          );
          if (index !== -1) {
            myLockedSeats.value.splice(index, 1);
          }
          
          // Update stats
          if (seatStats.value) {
            seatStats.value.availableSeats++;
            seatStats.value.lockedSeats--;
          }
          
          console.log(`Seat ${getRowLabel(row)}${col + 1} unlocked successfully`);
        } else {
          console.error('Failed to unlock seat:', result.message);
          alert('Failed to unlock seat. Please try again.');
        }
      } catch (error) {
        console.error('Error unlocking seat:', error);
        alert('Error unlocking seat. Please try again.');
      }
    };

    // Handle seat click - select, deselect, or unlock
    const handleSeatClick = async (row, col) => {
      if (!seats.value || 
          !Array.isArray(seats.value) || 
          !seats.value[row] || 
          !Array.isArray(seats.value[row]) || 
          !seats.value[row][col]) {
        console.error('Invalid seat array or seat position');
        return;
      }
      
      const seat = seats.value[row][col];
      
      if (!seat || seat.status === -1 || seat.status === 2) {
        // 不是座位，或者已售出，不可点击
        return;
      }
      
      // 如果是被其他用户锁定的，不可点击
      if (seat.status === 3) {
        return;
      }
      
      // 如果是被当前用户锁定的，尝试解锁
      if (seat.status === 4 || (seat.lockSessionId && isMyLockSession(seat.lockSessionId))) {
        await unlockSeat(row, col);
        return;
      }
      
      // Otherwise toggle selection
      const newArray = JSON.parse(JSON.stringify(seats.value));
      if (newArray[row][col].status === 1) {
        newArray[row][col].status = 0; // Deselect
      } else {
        newArray[row][col].status = 1; // Select
      }
      seats.value = newArray;
    };
    
    // Reset seats
    const resetSeats = () => {
      const newArray = JSON.parse(JSON.stringify(seats.value));
      for (let i = 0; i < seatRow.value; i++) {
        for (let j = 0; j < seatCol.value; j++) {
          if (newArray[i][j].status === 1) {
            newArray[i][j].status = 0;
          }
        }
      }
      seats.value = newArray;
    };
    
    // 初始化座位数组，确保在组件挂载前就有一个有效的数组
    const initEmptySeatArray = () => {
      seats.value = Array(seatRow.value).fill(0).map(() => 
        Array(seatCol.value).fill(0).map(() => ({ 
          status: 0, 
          lockSessionId: null,
          userId: null
        }))
      );
    };
    
    onMounted(() => {
      // 确保有一个初始的座位数组
      initEmptySeatArray();
      
      fetchSeatData().then(() => {
        // 在座位数据加载完成后恢复之前的选择
        restorePreviousSelection();
      });
      window.addEventListener('resize', adjustSeatSize);
    });
    
    onUnmounted(() => {
      window.removeEventListener('resize', adjustSeatSize);
      
      // 获取锁定会话ID
      const lockSessionId = localStorage.getItem('lockSessionId');
      const selectedSeatsJson = localStorage.getItem('selectedSeats');
      
      // 只有在用户未进入支付页面时才解锁座位
      // 检查当前路径是否是支付页面
      const currentPath = window.location.pathname;
      const isNavigatingToPayment = currentPath.includes(`/events/${props.eventId}/payment`);
      
      // 如果不是导航到支付页面，且有锁定会话ID和选定的座位，尝试释放锁定
      if (!isNavigatingToPayment && lockSessionId && selectedSeatsJson && props.eventId) {
        try {
          const selectedSeats = JSON.parse(selectedSeatsJson);
          
          // 使用axiosInstance替代fetch
          axiosInstance.post(`/public/events/${props.eventId}/seats/unlock`, {
            lockSessionId,
            seats: selectedSeats.map((seat) => ({
              row: String.fromCharCode(64 + seat.row), // 转换为字母行号 (1->A, 2->B, etc.)
              seatNumber: seat.seatNumber.toString()
            }))
          }).catch(err => console.error('Failed to unlock seats:', err));
          
          // 不要清除本地存储，让支付页面可以使用这些信息
          // localStorage.removeItem('lockSessionId');
        } catch (error) {
          console.error('Error releasing seat locks:', error);
        }
      }
    });
    
    return {
      loading,
      error,
      seats,
      seatRow,
      seatCol,
      seatSize,
      seatPrice,
      seatStats,
      isLocking,
      innerSeatWrapper,
      handleSeatClick,
      resetSeats,
      getSelectedSeats,
      proceedToPayment,
      getRowLabel,
      showSeatNumbers,
      zoomIn,
      zoomOut,
      getSeatClass
    };
  }
};
</script>

<style scoped>
.wrapper {
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  user-select: none;
  display: flex;
  flex-direction: column;
}

.cinema-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.seat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 500px; /* 增加最小高度确保有足够空间 */
}

@media (min-width: 768px) {
  .seat-container {
    flex-direction: row;
    gap: 15px;
    min-height: 550px; /* 在桌面视图下增加更多空间 */
  }
  
  .seat-wrapper {
    flex: 2;
  }
  
  .selected-seats-info {
    flex: 1;
    max-width: 300px;
    margin: 0;
    align-self: stretch;
    display: flex;
    flex-direction: column;
  }
}

.btn-buy {
  height: 100%;
  line-height: 30px;
  font-size: 14px;
  border-radius: 5px;
  padding: 0 10px;
  background-color: #ffa349;
  color: #ffffff;
  display: inline-block;
  cursor: pointer;
  margin-right: 10px;
  border: none;
}

.btn-buy:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
  margin: 10px 0;
  height: 40px;
  line-height: 40px;
}

.seat-wrapper {
  flex: 1;
  min-height: 400px; /* 增加最小高度 */
  max-height: 600px; /* 增加最大高度 */
  width: 100%;
  border: 1px dotted #c5c5c5;
  margin: 0 auto 10px;
  position: relative;
  overflow: hidden;
}

.screen {
  margin: 0 auto;
  height: 30px;
  width: 300px;
  background-color: #333;
  color: white;
  border-radius: 0 0 30px 30px;
  line-height: 30px;
  text-align: center;
}

.screen-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px;
  font-size: 13px;
  border-radius: 5px;
  top: 50px;
  background-color: #f6f6f6;
  color: #636363;
  border: 1px solid #b1b1b1;
}

.mid-line {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 100%;
  width: 1px;
  height: 100%;
  border-left: 1px dashed #919191;
}

.inner-seat-wrapper {
  position: absolute;
  top: 90px;
  bottom: 10px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px 20px 20px;
  overflow-y: auto;
  max-height: calc(100% - 90px);
  height: auto; /* 确保高度自动适应内容 */
}

.seat-row {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
  flex-wrap: nowrap;
  align-items: center;
}

.row-label {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  width: 20px;
  text-align: center;
  margin: 0 5px;
}

.seat {
  display: inline-block;
  margin: 2px;
  box-sizing: border-box;
  position: relative;
}

.seat-number {
  position: absolute;
  font-size: 9px;
  color: #666;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.no-seat {
  visibility: hidden;
}

.inner-seat {
  width: 100%;
  height: 100%;
  cursor: pointer;
  border-radius: 5px;
  box-sizing: border-box;
  border: 2px solid #ccc;
}

.selected-seat {
  background-color: #4CAF50;
  border: 2px solid #2e7d32;
}

.unselected-seat {
  background-color: #fff;
  border: 2px solid #ccc;
}

.bought-seat {
  background-color: #f44336;
  border: 2px solid #c62828;
}

.illustration {
  position: absolute;
  left: 0;
  top: 0;
  height: auto;
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 10px;
}

.illustration-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
}

.illustration-img-wrapper {
  width: 25px;
  height: 25px;
  display: inline-block;
  border-radius: 5px;
  box-sizing: border-box;
  margin-right: 8px;
}

.illustration-text {
  display: inline-block;
  height: auto;
  line-height: normal;
  font-size: 14px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
}

.selected-seats-info {
  width: 100%;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
  box-sizing: border-box;
}

.selected-seats-list {
  margin: 10px 0;
  max-height: 150px;
  overflow-y: auto;
}

.selected-seat-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.total-price {
  font-weight: bold;
  text-align: right;
  margin: 10px 0;
  font-size: 18px;
}

.seat-stats {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  background-color: #f8f9fa;
  padding: 8px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-item {
  margin: 0 15px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-right: 5px;
}

.stat-value {
  font-weight: bold;
  color: #212529;
}

.locked-seat {
  background-color: #FFC107;
  border: 2px solid #FFA000;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px);
}

.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.zoom-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-text {
  margin: 0 10px;
  font-size: 14px;
  color: #666;
}

/* 移动设备优化 */
@media (max-width: 767px) {
  .seat-wrapper {
    min-height: 350px;
  }
  
  .illustration {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    padding: 5px;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 10;
  }
  
  .illustration-item {
    margin: 0 5px;
  }
  
  .inner-seat-wrapper {
    top: 120px;
  }
  
  .row-label {
    width: 15px;
    font-size: 10px;
    margin: 0 2px;
  }
  
  .seat-number {
    font-size: 8px;
  }
}

.my-locked-seat {
  background-color: #FF9800;
  border: 2px solid #F57C00;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px);
  cursor: pointer;
  position: relative;
}

.unlock-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #333;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s;
}

.my-locked-seat:hover .unlock-icon {
  opacity: 1;
}

.my-locked-seat:hover {
  background-color: #FF7043;
}
</style> 