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
      
      <div class="seat-container">
        <div class="seat-wrapper">
          <div class="illustration">
            <div class="illustration-img-wrapper unselected-seat"></div>
            <span class="illustration-text">Available</span>
            <div class="illustration-img-wrapper selected-seat"></div>
            <span class="illustration-text">Selected</span>
            <div class="illustration-img-wrapper bought-seat"></div>
            <span class="illustration-text">Unavailable</span>
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
            <div v-for="(row, rowIndex) in seatArray" :key="`row-${rowIndex}`" class="seat-row">
              <div v-for="(seat, colIndex) in row" 
                  :key="`seat-${rowIndex}-${colIndex}`"
                  class="seat"
                  :style="{ width: `${seatSize}px`, height: `${seatSize}px` }"
                  :class="{ 'no-seat': seat === -1 }">
                <div class="inner-seat"
                    @click="handleChooseSeat(rowIndex, colIndex)"
                    v-if="seat !== -1"
                    :class="seat === 2 ? 'bought-seat' : (seat === 1 ? 'selected-seat' : 'unselected-seat')">
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="selected-seats-info" v-if="getSelectedSeats().length > 0">
          <h4>Selected Seats: {{ getSelectedSeats().length }}</h4>
          <div class="selected-seats-list">
            <div v-for="(seat, index) in getSelectedSeats()" :key="index" class="selected-seat-item">
              Row {{ seat.row + 1 }} - Seat {{ seat.col + 1 }}
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
    const loading = ref(true);
    const error = ref(null);
    const isLocking = ref(false);
    const seatPrice = ref(25.00); // Default seat price
    const innerSeatWrapper = ref(null);
    const seatSize = ref(25); // 默认座位尺寸
    const seatStats = ref(null);
    
    // Number of rows and columns
    const seatRow = ref(12);
    const seatCol = ref(18);
    
    // Seat array (-1: not a seat, 0: available, 1: selected, 2: unavailable/booked)
    const seatArray = ref([]);
    
    // Initialize seat array
    const initSeatArray = () => {
      const newArray = Array(seatRow.value).fill(0).map(() => Array(seatCol.value).fill(0));
      seatArray.value = newArray;
      
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
      // Create a seat layout similar to the image
      
      // Set booked seats (red)
      const soldSeats = [
        [3, 8], [3, 9], 
        [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10],
        [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9], [5, 10], [5, 11], [5, 12],
        [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 9], [6, 16], [6, 17]
      ];
      
      soldSeats.forEach(([row, col]) => {
        if (row < seatRow.value && col < seatCol.value) {
          seatArray.value[row][col] = 2; // Booked
        }
      });
      
      // Initialize seat stats for mock data
      seatStats.value = {
        totalRows: seatRow.value,
        maxColumns: seatCol.value,
        totalSeats: seatRow.value * seatCol.value,
        availableSeats: seatRow.value * seatCol.value - soldSeats.length,
        bookedSeats: soldSeats.length,
        lockedSeats: 0,
        unavailableSeats: 0
      };
    };
    
    // Get selected seats
    const getSelectedSeats = () => {
      const selected = [];
      for (let i = 0; i < seatRow.value; i++) {
        for (let j = 0; j < seatCol.value; j++) {
          if (seatArray.value[i] && seatArray.value[i][j] === 1) {
            selected.push({ row: i, col: j });
          }
        }
      }
      return selected;
    };
    
    // Handle seat selection
    const handleChooseSeat = (row, col) => {
      if (!seatArray.value[row] || seatArray.value[row][col] === -1 || seatArray.value[row][col] === 2) {
        return; // Non-seat or booked seat cannot be selected
      }
      
      const newArray = JSON.parse(JSON.stringify(seatArray.value));
      if (newArray[row][col] === 1) {
        newArray[row][col] = 0; // Deselect
      } else {
        newArray[row][col] = 1; // Select
      }
      seatArray.value = newArray;
    };
    
    // Reset seats
    const resetSeats = () => {
      const newArray = JSON.parse(JSON.stringify(seatArray.value));
      for (let i = 0; i < seatRow.value; i++) {
        for (let j = 0; j < seatCol.value; j++) {
          if (newArray[i][j] === 1) {
            newArray[i][j] = 0;
          }
        }
      }
      seatArray.value = newArray;
    };
    
    // Fetch seat data from API
    const fetchSeatData = async () => {
      try {
        loading.value = true;
        
        // Update seat price if available
        if (props.event && props.event.basePrice) {
          seatPrice.value = parseFloat(props.event.basePrice);
        }
        
        // Fetch seat data from API
        const response = await fetch(`/api/public/events/${props.eventId}/seats`);
        if (!response.ok) {
          throw new Error('Failed to fetch seat data');
        }
        
        const data = await response.json();
        if (data.success) {
          // Process seat data
          const seatData = data.data;
          
          // Store seat statistics
          seatStats.value = seatData.stats;
          
          // Update seat rows based on returned data
          const rowKeys = Object.keys(seatData.rows);
          seatRow.value = rowKeys.length;
          
          // Find the maximum number of columns
          let maxCols = 0;
          for (const row in seatData.rows) {
            const rowSeats = seatData.rows[row];
            if (rowSeats.length > maxCols) {
              maxCols = rowSeats.length;
            }
          }
          seatCol.value = maxCols;
          
          // Initialize seat array
          const newArray = Array(seatRow.value).fill(0).map(() => Array(seatCol.value).fill(0));
          
          // Fill seat data
          rowKeys.forEach((rowKey, rowIndex) => {
            const rowSeats = seatData.rows[rowKey];
            rowSeats.forEach((seat, colIndex) => {
              // Set value based on seat status
              switch(seat.status) {
                case 'available':
                  newArray[rowIndex][colIndex] = 0; // Available
                  break;
                case 'locked':
                case 'booked':
                  newArray[rowIndex][colIndex] = 2; // Unavailable (locked or booked)
                  break;
                case 'unavailable':
                default:
                  newArray[rowIndex][colIndex] = -1; // Not a seat
                  break;
              }
            });
          });
          
          seatArray.value = newArray;
          
          // 根据场地大小调整座位选择框的大小
          setTimeout(() => {
            adjustSeatSize();
          }, 0);
        } else {
          // If API call fails, use mock data
          console.error('API returned error:', data.message);
          initSeatArray();
        }
      } catch (err) {
        console.error('Error fetching seat data:', err);
        error.value = 'Failed to load seat information';
        // Use mock data as fallback
        initSeatArray();
      } finally {
        loading.value = false;
      }
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
    };
    
    // Proceed to payment
    const proceedToPayment = () => {
      const selected = getSelectedSeats();
      if (selected.length === 0) return;
      
      isLocking.value = true;
      
      // Convert selected seats to format suitable for next page
      const seatSelections = selected.map(seat => ({
        row: seat.row + 1,
        seatNumber: seat.col + 1,
        price: seatPrice.value
      }));
      
      // Store selection in localStorage or state management
      localStorage.setItem('selectedSeats', JSON.stringify(seatSelections));
      
      // Navigate to payment page
      router.push({
        name: 'payment',
        params: { eventId: props.eventId }
      });
    };
    
    onMounted(() => {
      fetchSeatData();
      window.addEventListener('resize', adjustSeatSize);
    });
    
    onUnmounted(() => {
      window.removeEventListener('resize', adjustSeatSize);
    });
    
    return {
      loading,
      error,
      seatArray,
      seatRow,
      seatCol,
      seatSize,
      seatPrice,
      seatStats,
      isLocking,
      innerSeatWrapper,
      handleChooseSeat,
      resetSeats,
      getSelectedSeats,
      proceedToPayment
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
}

@media (min-width: 768px) {
  .seat-container {
    flex-direction: row;
    gap: 15px;
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
  min-height: 350px;
  max-height: 450px;
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
}

.seat-row {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
  flex-wrap: nowrap;
}

.seat {
  display: inline-block;
  margin: 2px;
  box-sizing: border-box;
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
  height: 35px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 15px;
}

.illustration-img-wrapper {
  width: 25px;
  height: 25px;
  display: inline-block;
  border-radius: 5px;
  box-sizing: border-box;
  margin-left: 10px;
}

.illustration-text {
  display: inline-block;
  height: 100%;
  line-height: 35px;
  font-size: 14px;
  margin-right: 15px;
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
</style> 