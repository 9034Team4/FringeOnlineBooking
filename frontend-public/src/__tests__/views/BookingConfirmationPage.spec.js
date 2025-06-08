import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import BookingConfirmationPage from '@/views/BookingConfirmationPage.vue';
import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

// Mock vuex store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { 
      id: 'test-user-id',
      firstName: '测试',
      lastName: '用户'
    }
  })
}));

// Mock axios
vi.mock('axios');

// Mock window.alert
window.alert = vi.fn();

describe('BookingConfirmationPage.vue', () => {
  let router;
  let wrapper;
  
  // Mock route params and data
  const testEventId = 'test-event-id';
  const testSeatIds = [1, 2];
  const testTimestamp = Date.now().toString();
  const mockEvent = {
    id: testEventId,
    title: '测试活动',
    startDate: new Date('2023-06-01T19:00:00').toISOString(),
    venue: {
      id: 'venue-1',
      name: '测试场馆'
    }
  };
  const mockSeats = [
    { id: 1, row: 'A', seatNumber: '1', status: 'booked', price: 50, section: 'Main' },
    { id: 2, row: 'A', seatNumber: '2', status: 'booked', price: 60, section: 'Main' }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create router instance
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/login',
          name: 'login'
        },
        {
          path: '/my-tickets',
          name: 'my-tickets'
        },
        {
          path: '/booking/confirmation/:eventId',
          name: 'booking-confirmation'
        }
      ]
    });

    // Mock route
    router.push({
      name: 'booking-confirmation',
      params: { eventId: testEventId },
      query: { 
        seats: testSeatIds.join(','),
        timestamp: testTimestamp
      }
    });

    // Mock API responses
    axios.get.mockImplementation(url => {
      if (url.includes('/public/events/')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockEvent
          }
        });
      }
      if (url.includes('/events/') && url.includes('/seats')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSeats
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mount component
    wrapper = mount(BookingConfirmationPage, {
      global: {
        plugins: [router]
      }
    });
  });

  it('renders correctly with loading state', async () => {
    expect(wrapper.find('.spinner-border').exists()).toBe(true);
    await flushPromises();
    expect(wrapper.find('.spinner-border').exists()).toBe(false);
  });

  it('loads and displays event and seat information', async () => {
    await flushPromises();
    
    // Check API calls
    expect(axios.get).toHaveBeenCalledWith(`/api/public/events/${testEventId}`);
    expect(axios.get).toHaveBeenCalledWith(`/api/events/${testEventId}/seats`);
    
    // Check event details display
    expect(wrapper.text()).toContain(mockEvent.title);
    expect(wrapper.text()).toContain(mockEvent.venue.name);
    
    // Check seat information
    const seatRows = wrapper.findAll('tbody tr');
    expect(seatRows.length).toBe(mockSeats.length);
    expect(seatRows[0].text()).toContain('A'); // Row
    expect(seatRows[0].text()).toContain('1'); // Seat number
    expect(seatRows[1].text()).toContain('A'); // Row
    expect(seatRows[1].text()).toContain('2'); // Seat number
    
    // Check price calculations
    expect(wrapper.text()).toContain('$50.00'); // First seat price
    expect(wrapper.text()).toContain('$60.00'); // Second seat price
    expect(wrapper.text()).toContain('$110.00'); // Total
  });

  it('displays user information correctly', async () => {
    await flushPromises();
    
    // Check user info is displayed
    expect(wrapper.text()).toContain('测试 用户');
  });

  it('generates and displays order number', async () => {
    await flushPromises();
    
    // Check order number is displayed
    expect(wrapper.text()).toContain('订单编号: #');
    
    // Check that the order number format is correct
    const orderNumber = wrapper.vm.generateOrderNumber();
    expect(orderNumber).toContain('test'); // Should contain part of the user ID
    expect(orderNumber.length).toBeGreaterThan(5); // Should be reasonably long
  });

  it('calculates total price correctly', async () => {
    await flushPromises();
    
    // Check total calculation
    expect(wrapper.vm.calculateTotal()).toBe(110); // 50 + 60
  });

  it('shows alert when download ticket button is clicked', async () => {
    await flushPromises();
    
    // Click download button
    const downloadButton = wrapper.findAll('button')[0];
    expect(downloadButton.text()).toContain('下载票据');
    await downloadButton.trigger('click');
    
    // Check alert was shown
    expect(window.alert).toHaveBeenCalledWith('票据下载功能正在开发中...');
  });

  it('navigates to my tickets page when button is clicked', async () => {
    await flushPromises();
    
    // Click my tickets button
    const myTicketsButton = wrapper.findAll('button')[1];
    expect(myTicketsButton.text()).toContain('查看我的票');
    await myTicketsButton.trigger('click');
    
    // Check navigation
    expect(router.currentRoute.value.name).toBe('my-tickets');
  });

  it('redirects to login if user is not authenticated', async () => {
    // Mock unauthenticated user
    vi.mock('@/stores/auth', () => ({
      useAuthStore: () => ({
        isAuthenticated: false,
        user: null
      })
    }), { virtual: true });
    
    // Create a new wrapper
    const unauthWrapper = mount(BookingConfirmationPage, {
      global: {
        plugins: [router]
      }
    });
    
    await flushPromises();
    
    // Should redirect to login
    expect(router.currentRoute.value.name).toBe('login');
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    axios.get.mockImplementation(() => {
      return Promise.reject(new Error('API Error'));
    });
    
    // Create a new wrapper
    const errorWrapper = mount(BookingConfirmationPage, {
      global: {
        plugins: [router]
      }
    });
    
    await flushPromises();
    
    // Should show error message
    expect(errorWrapper.find('.alert-danger').exists()).toBe(true);
    expect(errorWrapper.find('.alert-danger').text()).toContain('API Error');
  });

  it('formats date and time correctly', () => {
    expect(wrapper.vm.formatDate('2023-06-01T19:00:00')).toMatch(/2023年/);
    expect(wrapper.vm.formatTime('2023-06-01T19:00:00')).toMatch(/19:/);
  });
}); 