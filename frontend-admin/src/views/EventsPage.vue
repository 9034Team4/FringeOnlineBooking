<template>
  <div class="events-page">
    <h2>Event Management</h2>
    <!-- Search Bar and Add Button -->
    <div class="toolbar">
      <div class="search-filter">
        <div class="search-container">
          <input 
            v-model="search" 
            class="search-input" 
            placeholder="Search by event title..." 
            @keyup.enter="applyFilters"
          />
          <button class="search-btn" @click="applyFilters">
            🔍
          </button>
          <button v-if="search" class="clear-btn" @click="clearSearch">
            ×
          </button>
        </div>
        <select v-model="categoryFilter" class="category-filter">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat">{{ cat }}</option>
        </select>
      </div>
      <button class="add-btn" @click="openAddModal">Add Event</button>
    </div>

    <!-- Event Table -->
    <div class="event-table-wrapper">
      <table class="event-table">
        <thead>
          <tr>
            <!-- <th class="column-image">IMAGE</th> -->
            <th class="column-title">TITLE</th>
            <th class="column-category">CATEGORY</th>
            <th class="column-date">DATE</th>
            <th class="column-venue">VENUE</th>
            <th class="column-price">PRICE</th>
            <th class="column-capacity">CAPACITY</th>
            <th class="column-status">STATUS</th>
            <th class="column-operation">OPERATION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <!-- <td class="column-image">
              <img src="/images/event-1.jpg" alt="Event Image" class="event-thumbnail" />
            </td> -->
            <td class="column-title">
              <div class="truncate-text" :title="event.title">{{ event.title }}</div>
            </td>
            <td class="column-category">{{ event.category }}</td>
            <td class="column-date">{{ formatDate(event.startDate) }}</td>
            <td class="column-venue">
              <div class="truncate-text" :title="event.venueName || 'N/A'">{{ event.venueName || 'N/A' }}</div>
            </td>
            <td class="column-price">${{ event.price }}</td>
            <td class="column-capacity">{{ event.capacity }}</td>
            <td class="column-status">
              <span
                class="status"
                :class="{
                  'published': event.status === 'published',
                  'draft': event.status === 'draft',
                  'cancelled': event.status === 'cancelled'
                }"
              >
                {{ capitalizeFirstLetter(event.status) }}
              </span>
            </td>
            <td class="column-operation">
              <div class="operation-buttons">
                <button class="op-btn detail" @click="viewEventDetails(event)">Detail</button>
                <button class="op-btn edit" @click="openEditModal(event)">Edit</button>
                <button class="op-btn delete" @click="openDeleteModal(event)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading events...</p>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && events.length === 0" class="empty-state">
      <p>No events found. Try adjusting your search or create a new event.</p>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="!loading && totalPages > 0">
      <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Prev</button>
      
      <!-- 显示页码，最多显示5个页码 -->
      <template v-if="totalPages <= 7">
        <button 
          v-for="page in totalPages" 
          :key="page" 
          :class="{ active: currentPage === page }" 
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>
      <template v-else>
        <!-- 显示第一页 -->
        <button 
          :class="{ active: currentPage === 1 }" 
          @click="goToPage(1)"
        >
          1
        </button>
        
        <!-- 显示省略号 -->
        <span v-if="currentPage > 3" class="ellipsis">...</span>
        
        <!-- 显示当前页附近的页码 -->
        <template v-for="page in totalPages">
          <button 
            v-if="page !== 1 && page !== totalPages && Math.abs(page - currentPage) < 2"
            :key="page"
            :class="{ active: currentPage === page }" 
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </template>
        
        <!-- 显示省略号 -->
        <span v-if="currentPage < totalPages - 2" class="ellipsis">...</span>
        
        <!-- 显示最后一页 -->
        <button 
          :class="{ active: currentPage === totalPages }" 
          @click="goToPage(totalPages)"
        >
          {{ totalPages }}
        </button>
      </template>
      
      <button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next</button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container" ref="modalContainerRef" @keydown="handleModalKeydown" tabindex="0">
          <h3>{{ modalType === 'add' ? 'Add Event' : 'Edit Event' }}</h3>
          
          <div class="form-group">
            <label>Title</label>
            <input v-model="modalEvent.title" placeholder="Event Title" class="modal-input" />
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="modalEvent.description" placeholder="Event Description" class="modal-input textarea"></textarea>
          </div>
          
          <div class="form-group">
            <label>Event Image</label>
            <div class="image-upload-container">
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Event Image Preview" />
                <button type="button" class="remove-image" @click="removeImage">×</button>
              </div>
              <div v-else class="upload-placeholder" @click="triggerFileInput">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to upload image</p>
              </div>
              <input
                type="file"
                ref="fileInput"
                @change="handleImageUpload"
                accept="image/*"
                class="file-input"
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Start Date</label>
              <div class="date-input-wrapper">
                <input v-model="modalEvent.startDate" type="datetime-local" class="modal-input date-input" />
                <span class="date-icon">📅</span>
              </div>
            </div>
            <div class="form-group half">
              <label>End Date</label>
              <div class="date-input-wrapper">
                <input v-model="modalEvent.endDate" type="datetime-local" class="modal-input date-input" />
                <span class="date-icon">📅</span>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Category</label>
              <select v-model="modalEvent.category" class="modal-input select-input">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group half">
              <label>Status</label>
              <select v-model="modalEvent.status" class="modal-input select-input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group half">
              <label>Price ($)</label>
              <div class="price-input-wrapper">
                <span class="price-symbol">$</span>
                <input v-model.number="modalEvent.price" type="number" min="0" step="0.01" class="modal-input price-input" />
              </div>
            </div>
            <div class="form-group half">
              <label>Capacity</label>
              <input v-model.number="modalEvent.capacity" type="number" min="1" class="modal-input" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Venue</label>
            <select v-model="modalEvent.venueId" class="modal-input select-input">
              <option v-for="venue in venues" :key="venue.id" :value="venue.id">{{ venue.name }}</option>
            </select>
          </div>
          
          <div v-if="formError" class="form-error">{{ formError }}</div>
          <div class="modal-actions">
            <button class="save-btn" @click="saveEvent">Save</button>
            <button class="close-btn" @click="closeModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container" ref="deleteModalRef" @keydown="handleDeleteModalKeydown" tabindex="0">
          <h3>Delete Event</h3>
          <p>Are you sure you want to delete <b>{{ modalEvent.title }}</b>?</p>
          <div class="modal-actions">
            <button class="delete-btn" @click="confirmDelete">Delete</button>
            <button class="close-btn" @click="closeDeleteModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const isProd = process.env.NODE_ENV === 'production';
const router = useRouter();

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

// State
const events = ref([])
const venues = ref([
  { 
    id: '1', 
    name: 'Adelaide Festival Centre',
    address: 'King William Rd, Adelaide SA 5000, Australia',
    capacity: 120,
    description: 'A premier arts venue with assigned seating'
  },
  { 
    id: '2', 
    name: 'Adelaide Convention Centre',
    address: 'North Terrace, Adelaide SA 5000, Australia',
    capacity: 120,
    description: 'Modern convention center for large events'
  },
  { 
    id: '3', 
    name: 'The Garden of Unearthly Delights',
    address: 'Rundle Park / Kadlitpina, East Terrace, Adelaide SA 5000',
    capacity: 120,
    description: 'Outdoor venue with unique atmosphere'
  },
  { 
    id: '4', 
    name: 'Gluttony',
    address: 'Rymill Park / Murlawirrapurka, Cnr East Tce & Rundle St, Adelaide SA 5000',
    capacity: 120,
    description: 'Popular festival hub with multiple spaces'
  },
  { 
    id: '5', 
    name: 'Adelaide Town Hall',
    address: '128 King William St, Adelaide SA 5000, Australia',
    capacity: 120,
    description: 'Historic venue in the heart of the city'
  }
])
const loading = ref(true)
const search = ref('')
const categoryFilter = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalType = ref('add')
const modalEvent = ref({
  id: null,
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  venueId: '',
  price: 0,
  capacity: 0,
  category: 'Music',
  status: 'draft',
  imageUrl: ''
})
const formError = ref('')
const categories = ['Music', 'Arts & Culture', 'Business', 'Food & Drink', 'Health & Wellness', 'Technology', 'Education', 'Entertainment']

// Image upload
const fileInput = ref(null)
const imagePreview = ref('')
const imageFile = ref(null)

// 分页 - 修改为使用后端分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)

// Refs for accessibility
const modalContainerRef = ref(null)
const deleteModalRef = ref(null)

// 修改fetchEvents函数，支持分页参数
async function fetchEvents(page = 1, limit = 10) {
  loading.value = true
  try {
    const response = await axiosInstance.get(`/admin/events`, {
      params: {
        page,
        limit,
        // 如果有搜索或分类过滤，也可以添加到请求参数中
        ...(search.value ? { search: search.value } : {}),
        ...(categoryFilter.value ? { category: categoryFilter.value } : {})
      }
    })
    
    console.log(response.data)
    events.value = response.data.data || []
    
    // 更新分页信息
    if (response.data.pagination) {
      totalItems.value = response.data.pagination.total
      totalPages.value = response.data.pagination.totalPages
      currentPage.value = response.data.pagination.page
      pageSize.value = response.data.pagination.limit
    }
    
    loading.value = false  
  } catch (error) {
    console.error('Error fetching events:', error)
    loading.value = false
  }
}

// 修改goToPage函数，使用fetchEvents获取对应页面的数据
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    fetchEvents(page, pageSize.value)
  }
}

// 添加搜索和过滤函数
function applyFilters() {
  fetchEvents(1, pageSize.value) // 重置到第一页并应用过滤
}

// 添加防抖函数，避免频繁请求
let searchTimeout = null
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500) // 500ms后执行搜索
}

// 监听搜索和分类过滤的变化
watch(search, () => {
  if (search.value.length > 2 || search.value.length === 0) {
    debouncedSearch()
  }
})

watch(categoryFilter, () => {
  applyFilters()
})

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

// Image upload functions
function triggerFileInput() {
  fileInput.value.click()
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file type
  if (!file.type.match('image.*')) {
    formError.value = 'Please select an image file'
    return
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    formError.value = 'Image size should not exceed 5MB'
    return
  }
  
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = e => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imagePreview.value = ''
  imageFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Modal functions
function openAddModal() {
  modalType.value = 'add'
  modalEvent.value = {
    id: null,
    title: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    venueId: venues.value.length > 0 ? venues.value[0].id : '',
    price: 0,
    capacity: 0,
    category: 'Music',
    status: 'draft',
    imageUrl: ''
  }
  imagePreview.value = ''
  imageFile.value = null
  showModal.value = true
  formError.value = ''
  nextTick(() => {
    modalContainerRef.value && modalContainerRef.value.focus()
  })
}

function openEditModal(event) {
  modalType.value = 'edit'
  // Format dates for datetime-local input
  const formattedStartDate = new Date(event.startDate).toISOString().slice(0, 16)
  const formattedEndDate = new Date(event.endDate).toISOString().slice(0, 16)
  
  modalEvent.value = {
    ...event,
    startDate: formattedStartDate,
    endDate: formattedEndDate
  }
  
  // Set image preview if event has an image
  if (event.imageUrl) {
    imagePreview.value = fixImageUrl(event.imageUrl)
  } else {
    imagePreview.value = ''
  }
  imageFile.value = null
  
  showModal.value = true
  formError.value = ''
  nextTick(() => {
    modalContainerRef.value && modalContainerRef.value.focus()
  })
}

function closeModal() {
  showModal.value = false
  formError.value = ''
}

function openDeleteModal(event) {
  modalEvent.value = { ...event }
  showDeleteModal.value = true
  nextTick(() => {
    deleteModalRef.value && deleteModalRef.value.focus()
  })
}

function closeDeleteModal() {
  showDeleteModal.value = false
}

// Upload image to server and return URL
async function uploadImage() {
  if (!imageFile.value) return null
  
  try {
    // Create form data
    const formData = new FormData()
    formData.append('image', imageFile.value)
    
    // 确保在开发环境中正确设置请求URL和认证信息
    const token = localStorage.getItem('admin-token');
    
    // 直接使用完整URL，避免baseURL问题
    const uploadUrl = isProd ? 
      'http://3.25.85.247:3000/api/admin/upload' : 
      'http://3.25.85.247:3000/api/admin/upload';
    
    // 使用fetch API代替axios，确保正确发送multipart/form-data
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 不要手动设置Content-Type，让浏览器自动设置正确的boundary
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('上传成功:', data);
    
    return data.data.imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error(`上传图片失败: ${error.message}`)
  }
}

// Save event (create or update)
async function saveEvent() {
  // Validate form
  if (!modalEvent.value.title) {
    formError.value = 'Title is required'
    return
  }
  
  if (!modalEvent.value.description) {
    formError.value = 'Description is required'
    return
  }
  
  if (!modalEvent.value.startDate || !modalEvent.value.endDate) {
    formError.value = 'Start and end dates are required'
    return
  }
  
  if (new Date(modalEvent.value.endDate) <= new Date(modalEvent.value.startDate)) {
    formError.value = 'End date must be after start date'
    return
  }
  
  if (!modalEvent.value.venueId) {
    formError.value = 'Venue is required'
    return
  }
  
  if (modalEvent.value.price < 0) {
    formError.value = 'Price cannot be negative'
    return
  }
  
  if (modalEvent.value.capacity < 1) {
    formError.value = 'Capacity must be at least 1'
    return
  }
  
  try {
    // 准备要发送的数据，确保格式正确
    const eventData = {
      ...modalEvent.value,
      // 确保日期格式为ISO字符串
      startDate: new Date(modalEvent.value.startDate).toISOString(),
      endDate: new Date(modalEvent.value.endDate).toISOString(),
      // 确保价格和容量为数字
      price: Number(modalEvent.value.price),
      capacity: Number(modalEvent.value.capacity)
    };
    
    // Handle image upload if there's a new image
    if (imageFile.value) {
      try {
        const imageUrl = await uploadImage()
        if (imageUrl) {
          eventData.imageUrl = imageUrl
        }
      } catch (error) {
        formError.value = 'Failed to upload image'
        return
      }
    }
    
    console.log('保存事件数据:', eventData);
    
    // Create or update event
    if (modalType.value === 'add') {
      // Create new event
      const response = await axiosInstance.post(`/admin/events`, eventData)
      events.value.unshift(response.data.data)
    } else {
      // Update existing event
      const response = await axiosInstance.put(`/admin/events/${eventData.id}`, eventData)
      const index = events.value.findIndex(e => e.id === eventData.id)
      if (index !== -1) {
        events.value[index] = response.data.data
      }
    }
    closeModal()
  } catch (error) {
    console.error('Error saving event:', error)
    formError.value = error.response?.data?.message || 'Failed to save event'
    
    // 显示详细的验证错误信息
    if (error.response?.data?.error) {
      console.error('验证错误:', error.response.data.error)
      if (typeof error.response.data.error === 'string') {
        formError.value = error.response.data.error
      } else if (Array.isArray(error.response.data.error)) {
        formError.value = error.response.data.error.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ')
      }
    }
  }
}

// Delete event
async function confirmDelete() {
  try {
    await axiosInstance.delete(`/admin/events/${modalEvent.value.id}`)
    const index = events.value.findIndex(e => e.id === modalEvent.value.id)
    if (index !== -1) {
      events.value.splice(index, 1)
    }
    closeDeleteModal()
  } catch (error) {
    console.error('Error deleting event:', error)
    alert('Failed to delete event')
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Only fetch events, venues are now hardcoded
  await fetchEvents()
})

// New function to view event details
function viewEventDetails(event) {
  // Store current event information in localStorage for use in details page
  localStorage.setItem('current-event', JSON.stringify(event));
  // Redirect to event details page
  router.push(`/event-details/${event.id}`);
}

// Modal keyboard handlers
function handleModalKeydown(e) {
  if (e.key === 'Enter') {
    saveEvent()
  } else if (e.key === 'Escape') {
    closeModal()
  }
}

function handleDeleteModalKeydown(e) {
  if (e.key === 'Enter') {
    confirmDelete()
  } else if (e.key === 'Escape') {
    closeDeleteModal()
  }
}

// 添加清除搜索函数
function clearSearch() {
  search.value = '';
  applyFilters();
}

// New function to fix image URL
function fixImageUrl(url) {
  if (!url) return '';
  
  // 如果URL已经是完整的URL（包含http或https），则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 如果URL是相对路径，添加基础URL
  const baseUrl = isProd ? 'http://3.25.85.247:3000' : 'http://3.25.85.247:3000';
  
  // 如果URL已经包含/public，则直接添加基础URL
  if (url.startsWith('/public/')) {
    return `${baseUrl}${url}`;
  }
  
  // 否则，假设它是一个相对于/public/uploads/的路径
  if (!url.startsWith('/')) {
    return `${baseUrl}/public/uploads/${url}`;
  }
  
  // 其他情况，直接拼接
  return `${baseUrl}${url}`;
}
</script>

<style scoped>
.events-page {
  padding: 16px;
  font-family: 'ABeeZee', sans-serif;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.search-filter {
  display: flex;
  gap: 12px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input, .category-filter {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.search-input {
  width: 240px;
  padding-right: 60px; /* 为按钮留出空间 */
}

.search-btn, .clear-btn {
  position: absolute;
  background: none;
  border: none;
  cursor: pointer;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

.search-btn {
  right: 0;
}

.clear-btn {
  right: 30px;
  font-size: 18px;
  color: #999;
}

.clear-btn:hover {
  color: #333;
}

.add-btn {
  background: #16c2b8;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #14b3a9;
}

.event-table-wrapper {
  margin: 0 auto;
  background: #fafafd;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  padding: 32px 18px;
  overflow-x: auto;
  width: 100%;
  max-width: 100%;
}

.event-table {
  width: 100%;
  min-width: 1000px; /* 确保表格有最小宽度，强制在小屏幕上显示滚动条 */
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  font-family: 'ABeeZee', sans-serif;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  table-layout: fixed;
}

.event-table th, .event-table td {
  padding: 16px 12px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 定义列宽 */
.column-image { width: 80px; }
.column-title { width: 180px; }
.column-category { width: 120px; }
.column-date { width: 150px; }
.column-venue { width: 140px; }
.column-price { width: 80px; }
.column-capacity { width: 80px; }
.column-status { width: 100px; }
.column-operation { width: 200px; }

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-table th {
  background: #fafafd;
  color: #222;
  font-weight: bold;
  font-size: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.event-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
}

.event-table tbody tr:hover {
  background-color: #f9f9f9;
}

.event-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  color: #999;
  font-size: 12px;
  border-radius: 6px;
}

.status {
  border-radius: 12px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
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

.operation-buttons {
  display: flex;
  gap: 8px;
}

.op-btn {
  border: 1.5px solid #1976d2;
  background: #fff;
  color: #1976d2;
  border-radius: 12px;
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.op-btn:hover {
  background: #1976d2;
  color: #fff;
}

.op-btn.delete {
  border: 1.5px solid #e14a82;
  color: #e14a82;
}

.op-btn.delete:hover {
  background: #e14a82;
  color: #fff;
}

.op-btn.detail {
  border: 1.5px solid #4a90e2;
  color: #4a90e2;
}

.op-btn.detail:hover {
  background: #4a90e2;
  color: #fff;
}

.pagination {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 24px;
}

.pagination button {
  border: none;
  background: #f0f0f0;
  color: #333;
  border-radius: 4px;
  padding: 6px 14px;
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

.pagination .ellipsis {
  padding: 6px 12px;
  color: #333;
}

.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-wrapper {
  box-shadow: 0 2px 8px rgba(0,0,0,0.33);
  max-width: 90vw;
  width: 600px;
}

.modal-container {
  background: #fff;
  padding: 30px 40px;
  border-radius: 8px;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 10px;
  text-align: left;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group.half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  text-align: left;
  color: #333;
}

.modal-input {
  display: block;
  width: 100%;
  padding: 5px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
  transition: border-color 0.2s;
}

.modal-input:focus {
  border-color: #16c2b8;
  outline: none;
  box-shadow: 0 0 0 2px rgba(22, 194, 184, 0.2);
}

.modal-input.textarea {
  min-height: 60px;
  resize: vertical;
}

.select-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px;
}

.date-input-wrapper {
  position: relative;
}

.date-input {
}

.date-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
}

.price-input-wrapper {
  position: relative;
}

.price-symbol {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.price-input {
  padding-left: 24px;
  width: calc(100% - 24px);
}

.image-upload-container {
  border: 2px dashed #ccc;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  position: relative;
  transition: border-color 0.2s;
}

.image-upload-container:hover {
  border-color: #16c2b8;
}

.upload-placeholder {
  cursor: pointer;
  padding: 32px 0;
}

.upload-placeholder i {
  font-size: 32px;
  color: #999;
  margin-bottom: 8px;
}

.upload-placeholder p {
  margin: 0;
  color: #666;
}

.image-preview {
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.remove-image {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e14a82;
  color: white;
  border: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-image:hover {
  background-color: #c13872;
}

.file-input {
  display: none;
}

.modal-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.save-btn, .close-btn, .delete-btn {
  border: none;
  border-radius: 6px;
  padding: 10px 30px;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.save-btn:hover, .delete-btn:hover, .close-btn:hover {
  transform: translateY(-1px);
}

.save-btn:active, .delete-btn:active, .close-btn:active {
  transform: translateY(0);
}

.save-btn {
  background: #16c2b8;
  color: white;
}

.save-btn:hover {
  background: #14b3a9;
}

.delete-btn {
  background: #e14a82;
  color: white;
}

.delete-btn:hover {
  background: #c13872;
}

.close-btn {
  background: #f0f0f0;
  color: #333;
}

.close-btn:hover {
  background: #e0e0e0;
}

.form-error {
  color: #e14a82;
  margin-top: 16px;
  font-size: 14px;
  background-color: #fff0f5;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #e14a82;
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

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.category-filter {
  width: 160px;
}
</style>