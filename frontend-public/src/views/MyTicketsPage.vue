<template>
  <div class="my-tickets-page">
    <div class="container py-5">
      <div class="row">
        <div class="col-full">
          <h1 class="page-title mb-4">My Tickets</h1>
          
          <div v-if="loading" class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading your tickets...</p>
          </div>
          
          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <div v-else-if="tickets.length === 0" class="empty-tickets text-center py-5">
            <i class="bi bi-ticket-perforated-fill empty-icon"></i>
            <h3>You don't have any tickets yet</h3>
            <p class="text-muted">Browse events and book your first ticket</p>
            <button class="btn btn-primary mt-3" @click="router.push('/')">
              Browse Events
            </button>
          </div>
          
          <div v-else>
            <div class="tickets-container">
              <div class="custom-row">
                <div v-for="ticket in displayedTickets" :key="ticket.ticketId" class="ticket-column">
                  <div class="ticket-wrapper">
                    <TicketCard 
                      :ticketId="ticket.ticketId"
                      :showActions="true"
                      :status="ticket.status"
                      @download="downloadTicket"
                      @viewDetails="viewTicketDetails"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <nav v-if="totalPages > 1" class="mt-5">
              <ul class="pagination justify-content-center">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">
                    <i class="bi bi-chevron-left"></i>
                  </a>
                </li>
                <li v-for="page in paginationPages" :key="page" class="page-item" :class="{ active: currentPage === page }">
                  <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">
                    <i class="bi bi-chevron-right"></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '../stores/auth';
import TicketCard from '../components/TicketCard.vue';

export default {
  name: 'MyTicketsPage',
  components: {
    TicketCard
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const tickets = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    // Pagination
    const itemsPerPage = 6;
    const currentPage = ref(1);
    
    // User name
    const userName = computed(() => {
      if (authStore.user) {
        return `${authStore.user.firstName || ''} ${authStore.user.lastName || ''}`.trim();
      }
      return 'Unknown User';
    });
    
    // Format date
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
    
    // Format time
    const formatTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    };
    
    // Generate QR code content
    const generateQRValue = (ticket) => {
      const qrData = {
        ticketId: ticket.ticketId,
        eventId: ticket.eventId,
        bookingId: ticket.bookingId,
        seat: ticket.seatInfo,
        ticketNumber: ticket.ticketNumber,
        userId: authStore.user?.id
      };
      
      return JSON.stringify(qrData);
    };
    
    // 已排序的票据（按创建时间倒序）
    const sortedTickets = computed(() => {
      // 复制一份数组以避免修改原始数据
      return [...tickets.value].sort((a, b) => {
        // 按购买日期倒序排列（最新的在前面）
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
      });
    });
    
    // 当前页显示的票据
    const displayedTickets = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return sortedTickets.value.slice(start, end);
    });
    
    // 总页数
    const totalPages = computed(() => {
      return Math.ceil(tickets.value.length / itemsPerPage);
    });
    
    // 分页页码
    const paginationPages = computed(() => {
      const pages = [];
      const maxPagesToShow = 5;
      
      if (totalPages.value <= maxPagesToShow) {
        // 如果总页数少于最大显示页数，显示所有页
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i);
        }
      } else {
        // 否则显示当前页周围的页码
        let startPage = Math.max(1, currentPage.value - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;
        
        if (endPage > totalPages.value) {
          endPage = totalPages.value;
          startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    });
    
    // 获取用户票据
    const fetchTickets = async () => {
      try {
        loading.value = true;
        
        // 检查用户是否已登录
        if (!authStore.isAuthenticated) {
          router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
          return;
        }
        
        const response = await axiosInstance.get('/public/user/tickets', {
          headers: { Authorization: `Bearer ${authStore.token}` }
        });
        
        if (response.data.success) {
          // 检查响应数据结构
          const ticketsData = Array.isArray(response.data.data) ? 
            response.data.data : 
            (response.data.data.tickets || []);
          
          // 处理从API获取的票据
          tickets.value = ticketsData.map(ticket => {
            // 计算票据状态
            const eventDate = new Date(ticket.eventDate);
            const now = new Date();
            let status = ticket.status || 'ACTIVE';
            
            // 如果API未提供状态，根据日期计算
            if (status === 'ACTIVE' && eventDate < now) {
              status = 'EXPIRED';
            }
            
            // 票据图片
            let eventImage = ticket.eventImage || '/assets/images/event-0.png';
            
            // 如果没有图片，根据eventId生成默认图片
            if (!ticket.eventImage) {
              const eventIdNum = parseInt(ticket.eventId.replace(/\D/g, '').substring(0, 4), 10) % 5;
              eventImage = `/assets/images/event-${eventIdNum || 0}.png`;
            }
            
            return {
              ...ticket,
              status,
              eventImage
            };
          });
        } else {
          throw new Error(response.data.message || 'Failed to get tickets');
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        error.value = err.message || 'Unable to load your tickets';
      } finally {
        loading.value = false;
      }
    };
    
    // 下载票据
    const downloadTicket = (ticketId) => {
      // 在实际应用中，这将调用API下载票据
      console.log(`Download ticket: ${ticketId}`);
      alert('Ticket download feature is under development...');
    };
    
    // 查看票据详情
    const viewTicketDetails = (ticketId) => {
      // 在实际应用中，这将导航到票据详情页面
      console.log(`View ticket details: ${ticketId}`);
      router.push({ name: 'ticket-details', params: { id: ticketId } });
    };
    
    // 切换页面
    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        window.scrollTo(0, 0);
      }
    };
    
    onMounted(() => {
      fetchTickets();
    });
    
    return {
      tickets,
      loading,
      error,
      currentPage,
      displayedTickets,
      totalPages,
      paginationPages,
      userName,
      router,
      formatDate,
      formatTime,
      generateQRValue,
      downloadTicket,
      viewTicketDetails,
      changePage
    };
  }
};
</script>

<style scoped>
.my-tickets-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 15px;
  padding-right: 15px;
}

.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -15px;
  margin-right: -15px;
}

.col-full {
  width: 100%;
  padding-left: 15px;
  padding-right: 15px;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.text-center {
  text-align: center;
}

.my-5 {
  margin-top: 3rem;
  margin-bottom: 3rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-5 {
  margin-top: 3rem;
}

.page-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
}

.empty-tickets {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.empty-icon {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 1rem;
  display: block;
}

.tickets-container {
  margin-top: 1.5rem;
}

/* 自定义栅格系统 */
.custom-row {
  display: flex;
  flex-wrap: wrap;
  margin: -12px; /* 负边距创建间隙 */
}

.ticket-column {
  width: 100%; /* 移动设备上一个占满 */
  padding: 12px; /* 创建间隙 */
  box-sizing: border-box;
}

.ticket-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式断点 */
@media (min-width: 768px) {
  .ticket-column {
    width: 50%; /* 平板上两个一行 */
  }
}

@media (min-width: 992px) {
  .ticket-column {
    width: 33.3333%; /* 桌面上三个一行 */
  }
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  list-style: none;
  padding: 0;
}

.page-item {
  margin: 0 4px;
}

.page-link {
  display: block;
  padding: 8px 12px;
  text-decoration: none;
  color: #333;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: #fff;
}

.page-item.active .page-link {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  opacity: 0.65;
}

.justify-content-center {
  justify-content: center;
}
</style> 