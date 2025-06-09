<template>
  <div class="ticket-container">
    <div v-if="loading" class="ticket-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    
    <div v-else-if="error" class="ticket-error">
      <div class="alert alert-danger p-2">
        <small>{{ error }}</small>
      </div>
    </div>
    
    <div v-else class="ticket-card" ref="ticketCardRef">
      <img class="event-image" :src="`/images/${ticketData.eventImage}`" alt="Event Poster" />
      
      <div class="event-info">
        <h2>{{ ticketData.eventTitle }}</h2>
        <p class="venue">{{ ticketData.formattedDate }} ~ {{ ticketData.venueName }}</p>
      </div>      
      <hr />
      
      <div class="ticket-details">
        <div class="detail-pair">
          <div>
            <p class="label">Name</p>
            <p class="value">{{ ticketData.customerName }}</p>
          </div>
          <div>
            <p class="label">Order Number</p>
            <p class="value">{{ ticketData.ticketNumber }}</p>
          </div>
        </div>
        
        <div class="detail-pair">
          <div>
            <p class="label">Date</p>
            <p class="value">{{ ticketData.formattedDate }}</p>
          </div>
          <div>
            <p class="label">Time</p>
            <p class="value">{{ ticketData.formattedTime }}</p>
          </div>
        </div>
        
        <div class="detail-pair">
          <div>
            <p class="label">Gate</p>
            <p class="value">{{ ticketData.gate || 'Main' }}</p>
          </div>
          <div>
            <p class="label">Seat</p>
            <p class="value">{{ ticketData.seatInfo }}</p>
          </div>
        </div>
      </div>
      
      <div class="barcode">
        <VueQrcode :value="generateQRValue()" :size="150" :level="'M'" />
        <p class="barcode-note">Scan your QR code at the entry gate.</p>
      </div>

      <div v-if="showActions" class="ticket-actions mt-3">
        <button class="action-btn download-btn" @click="downloadTicketAsImage" :disabled="isProcessing">
          <i class="bi bi-download"></i> {{ isDownloading ? 'Downloading...' : 'Download' }}
        </button>
        <button class="action-btn details-btn" @click="sendTicketByEmail" :disabled="isProcessing">
          <i class="bi bi-envelope"></i> {{ isSending ? 'Sending...' : 'Send to Email' }}
        </button>
      </div>
      
      <div v-if="emailStatus" :class="['email-status', emailStatus.type]">
        {{ emailStatus.message }}
      </div>
      
      <div v-if="status === 'USED'" class="ticket-status used">
        <span>USED</span>
      </div>
      <div v-else-if="status === 'EXPIRED'" class="ticket-status expired">
        <span>EXPIRED</span>
      </div>
      <div v-else-if="status === 'CANCELLED'" class="ticket-status cancelled">
        <span>CANCELLED</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '../stores/auth';
import VueQrcode from 'vue-qrcode';
import html2canvas from 'html2canvas';

export default defineComponent({
  name: 'TicketCard',
  components: {
    VueQrcode
  },
  props: {
    // 仅需要票的ID，其它信息将通过API获取
    ticketId: {
      type: String,
      required: true
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      default: false
    },
    // 票据状态（可选，如果不提供将从API获取）
    status: {
      type: String,
      default: null
    },
    // 如果你想使用传入的数据而不是从API获取，设置为true
    useProvidedData: {
      type: Boolean,
      default: false
    },
    // 以下是可选的数据属性，当useProvidedData为true时使用
    eventId: String,
    eventTitle: String,
    eventDate: String,
    venueName: String,
    customerName: String,
    ticketNumber: String,
    formattedDate: String,
    formattedTime: String,
    seatInfo: String,
    gate: String,
    eventImage: {
      type: String,
      default: '/assets/images/event-0.png'
    }
  },
  emits: ['download', 'viewDetails'],
  setup(props) {
    const authStore = useAuthStore();
    const loading = ref(true);
    const error = ref(null);
    const ticketCardRef = ref(null);
    const isDownloading = ref(false);
    const isSending = ref(false);
    const emailStatus = ref(null);
    
    // 是否正在处理中
    const isProcessing = ref(false);
    
    // 存储票据数据
    const ticketData = ref({
      ticketId: props.ticketId,
      eventId: props.eventId || '',
      eventTitle: props.eventTitle || '',
      venueName: props.venueName || '',
      customerName: props.customerName || '',
      ticketNumber: props.ticketNumber || '',
      formattedDate: props.formattedDate || '',
      formattedTime: props.formattedTime || '',
      seatInfo: props.seatInfo || '',
      gate: props.gate || 'Main',
      eventImage: props.eventImage || '/assets/images/event-0.png',
      eventDate: props.eventDate || '',
      bookingId: ''
    });
    
    // 下载票据为图片
    const downloadTicketAsImage = async () => {
      if (!ticketCardRef.value || isProcessing.value) return;
      
      try {
        isProcessing.value = true;
        isDownloading.value = true;
        
        // 创建票据的截图
        const canvas = await html2canvas(ticketCardRef.value, {
          scale: 2, // 更高的缩放比例以获得更好的质量
          useCORS: true, // 允许跨域图像
          backgroundColor: '#ffffff', // 白色背景
          logging: false
        });
        
        // 将canvas转换为图片URL
        const imageUrl = canvas.toDataURL('image/png');
        
        // 创建下载链接
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `${ticketData.value.eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Ticket_${ticketData.value.ticketNumber}.png`;
        
        // 触发下载
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log('Ticket downloaded successfully');
      } catch (err) {
        console.error('Error downloading ticket:', err);
        error.value = 'Failed to download ticket. Please try again.';
      } finally {
        isDownloading.value = false;
        isProcessing.value = false;
      }
    };
    
    // 通过电子邮件发送票据
    const sendTicketByEmail = async () => {
      if (isProcessing.value) return;
      
      try {
        isProcessing.value = true;
        isSending.value = true;
        emailStatus.value = null;
        
        // 先创建票据图片
        const canvas = await html2canvas(ticketCardRef.value, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        // 将canvas转换为Base64图片数据
        const imageData = canvas.toDataURL('image/png').split(',')[1]; // 移除前缀
        
        // 获取用户认证令牌
        const token = authStore.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // 发送请求到后端
        const response = await axiosInstance.post('/public/tickets/send-email', {
          ticketId: props.ticketId,
          imageData: imageData,
          subject: `${ticketData.value.eventTitle} - Ticket ${ticketData.value.ticketNumber}`,
          eventTitle: ticketData.value.eventTitle,
          customerName: ticketData.value.customerName
        }, { headers });
        
        if (response.data.success) {
          emailStatus.value = {
            type: 'success',
            message: 'Ticket sent to your email successfully!'
          };
        } else {
          throw new Error(response.data.message || 'Failed to send email');
        }
      } catch (err) {
        console.error('Error sending ticket by email:', err);
        emailStatus.value = {
          type: 'error',
          message: err.message || 'Failed to send email. Please try again.'
        };
      } finally {
        isSending.value = false;
        isProcessing.value = false;
        
        // 3秒后清除状态消息
        setTimeout(() => {
          if (emailStatus.value) {
            emailStatus.value = null;
          }
        }, 3000);
      }
    };
    
    // 生成二维码内容
    const generateQRValue = () => {
      const qrData = {
        ticketId: ticketData.value.ticketId,
        eventId: ticketData.value.eventId,
        bookingId: ticketData.value.bookingId,
        seat: ticketData.value.seatInfo,
        ticketNumber: ticketData.value.ticketNumber,
        userId: authStore.user?.id
      };
      
      return JSON.stringify(qrData);
    };
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
    };
    
    // 格式化时间
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    };
    
    // 获取票据数据
    const fetchTicketData = async () => {
      // 如果使用提供的数据，则不需要从API获取
      if (props.useProvidedData) {
        loading.value = false;
        return;
      }
      
      try {
        loading.value = true;
        
        // 获取认证令牌
        const token = authStore.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // 请求票据数据
        const response = await axiosInstance.get(`/public/tickets/${props.ticketId}`, { headers });
        
        if (response.data.success) {
          const ticketInfo = response.data.data;
          
          // 设置票据数据
          ticketData.value = {
            ticketId: props.ticketId,
            eventId: ticketInfo.eventId,
            eventTitle: ticketInfo.eventTitle,
            venueName: ticketInfo.venueName,
            customerName: ticketInfo.customerName || (authStore.user ? `${authStore.user.firstName || ''} ${authStore.user.lastName || ''}`.trim() : 'Guest'),
            ticketNumber: ticketInfo.ticketNumber || `TICKET-${props.ticketId.substring(0, 8)}`,
            formattedDate: formatDate(ticketInfo.eventDate),
            formattedTime: formatTime(ticketInfo.eventDate),
            seatInfo: ticketInfo.seatInfo || 'General Admission',
            gate: ticketInfo.gate || 'Main',
            eventImage: ticketInfo.eventImage || `/assets/images/event-${parseInt(ticketInfo.eventId.replace(/\D/g, '').substring(0, 4), 10) % 5 || 0}.png`,
            eventDate: ticketInfo.eventDate,
            bookingId: ticketInfo.bookingId || ''
          };
        } else {
          throw new Error(response.data.message || 'Failed to load ticket data');
        }
      } catch (err) {
        console.error('Error fetching ticket data:', err);
        
        // 在开发环境下，使用模拟数据
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock ticket data in TicketCard component');
          
          // 设置默认票据数据
          ticketData.value = {
            ticketId: props.ticketId,
            eventId: `event-${Math.floor(Math.random() * 10000)}`,
            eventTitle: 'Sample Event',
            venueName: 'Adelaide Town Hall',
            customerName: authStore.user ? `${authStore.user.firstName || ''} ${authStore.user.lastName || ''}`.trim() : 'Guest User',
            ticketNumber: `TICKET-${props.ticketId.substring(0, 8)}`,
            formattedDate: formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
            formattedTime: formatTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
            seatInfo: 'Row A - Seat 12',
            gate: 'Main',
            eventImage: `/assets/images/event-${Math.floor(Math.random() * 5)}.png`,
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            bookingId: `booking-${Math.floor(Math.random() * 10000)}`
          };
        } else {
          error.value = err.message || 'Failed to load ticket data';
        }
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(() => {
      fetchTicketData();
    });
    
    return {
      loading,
      error,
      ticketData,
      generateQRValue,
      ticketCardRef,
      downloadTicketAsImage,
      sendTicketByEmail,
      isDownloading,
      isSending,
      isProcessing,
      emailStatus
    };
  }
});
</script>

<style scoped>
.ticket-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  position: relative;
}

.ticket-loading,
.ticket-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.ticket-card {
  background: white;
  border-radius: 20px;
  padding: 1.2rem;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.event-image {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 1rem;
  object-fit: cover;
}

.event-info h2 {
  font-size: 1.2rem;
  font-weight: bold;
}

.venue {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 1rem;
}

.ticket-details {
  text-align: left;
  margin: 1rem 0;
}

.detail-pair {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.label {
  font-size: 0.75rem;
  color: #666;
}

.value {
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
}

.barcode img {
  width: 100%;
  height: auto;
  margin: 1rem 0 0.5rem;
}

.barcode-note {
  font-size: 0.75rem;
  color: #666;
}

.ticket-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.action-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 5px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.download-btn {
  background-color: #007bff;
  color: white;
}

.download-btn:hover:not(:disabled) {
  background-color: #0069d9;
}

.details-btn {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
}

.details-btn:hover:not(:disabled) {
  background-color: #e9ecef;
}

.ticket-status {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1;
}

.ticket-status span {
  font-size: 2.5rem;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 10px;
  transform: rotate(-30deg);
}

.ticket-status.used span {
  color: #6c757d;
  border: 5px solid #6c757d;
}

.ticket-status.expired span {
  color: #dc3545;
  border: 5px solid #dc3545;
}

.ticket-status.cancelled span {
  color: #fd7e14;
  border: 5px solid #fd7e14;
}

.email-status {
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  text-align: center;
}

.email-status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.email-status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style> 