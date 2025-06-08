import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PaymentPage from '@/views/PaymentPage.vue';
import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

// Mock PageHeader component
vi.mock('@/components/PageHeader.vue', () => ({
  default: {
    name: 'PageHeader',
    template: '<div class="mock-page-header"><slot /></div>'
  }
}));

// Mock vuex store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: 'test-user-id' }
  })
}));

// Mock axios
vi.mock('axios');

describe('PaymentPage.vue', () => {
  let router;
  let wrapper;
  
  // Mock route params and data
  const testEventId = 'test-event-id';
  const testSeatIds = [1, 2];
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
    { id: 1, row: 'A', seatNumber: '1', status: 'locked', price: 50, section: 'Main', remainingLockTime: 300 },
    { id: 2, row: 'A', seatNumber: '2', status: 'locked', price: 60, section: 'Main', remainingLockTime: 300 }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Create router instance
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/events/:id',
          name: 'event-details'
        },
        {
          path: '/login',
          name: 'login'
        },
        {
          path: '/booking/confirmation/:eventId',
          name: 'booking-confirmation'
        },
        {
          path: '/payment/:eventId',
          name: 'payment'
        }
      ]
    });

    // Mock route
    router.push({
      name: 'payment',
      params: { eventId: testEventId },
      query: { seats: testSeatIds.join(',') }
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
      if (url.includes('/seats/lock-status')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSeats.map(s => ({
              id: s.id,
              status: s.status,
              remainingLockTime: s.remainingLockTime
            }))
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

    // Mock successful API calls
    axios.post.mockImplementation((url) => {
      if (url === '/api/seats/confirm') {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Booking confirmed successfully'
          }
        });
      }
      if (url === '/api/seats/release-locks') {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Locks released successfully'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mount component
    wrapper = mount(PaymentPage, {
      global: {
        plugins: [router],
        stubs: {
          PageHeader: true,
          transition: false
        }
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
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
    expect(axios.get).toHaveBeenCalledWith(`/api/seats/lock-status?eventId=${testEventId}&seatIds=${testSeatIds.join(',')}`);
    expect(axios.get).toHaveBeenCalledWith(`/api/events/${testEventId}/seats`);
    
    // Check event details display
    expect(wrapper.text()).toContain(mockEvent.title);
    expect(wrapper.text()).toContain(mockEvent.venue.name);
    
    // Check seat information
    const seatRows = wrapper.findAll('tbody tr');
    expect(seatRows.length).toBe(mockSeats.length);
    expect(seatRows[0].text()).toContain('Row A - Seat 1');
    expect(seatRows[1].text()).toContain('Row A - Seat 2');
    
    // Check price calculations
    expect(wrapper.text()).toContain('$50.00'); // First seat price
    expect(wrapper.text()).toContain('$60.00'); // Second seat price
    expect(wrapper.text()).toContain('$110.00'); // Subtotal
    expect(wrapper.text()).toContain('$11.00'); // Service fee (10%)
    expect(wrapper.text()).toContain('$121.00'); // Total
  });

  it('shows the lock timer countdown', async () => {
    await flushPromises();
    
    // Check initial timer value
    expect(wrapper.text()).toContain('锁定时间剩余: 5:00');
    
    // Advance timer by 1 minute
    vi.advanceTimersByTime(60000);
    await wrapper.vm.$nextTick();
    
    // Check updated timer value
    expect(wrapper.text()).toContain('锁定时间剩余: 4:00');
    
    // Advance timer further
    vi.advanceTimersByTime(30000);
    await wrapper.vm.$nextTick();
    
    // Check updated timer value
    expect(wrapper.text()).toContain('锁定时间剩余: 3:30');
  });

  it('processes payment successfully', async () => {
    await flushPromises();
    
    // Set payment info
    await wrapper.find('#creditCard').setValue(true);
    await wrapper.find('#cardNumber').setValue('4242424242424242');
    await wrapper.find('#expiry').setValue('12/25');
    await wrapper.find('#cvv').setValue('123');
    await wrapper.find('#cardName').setValue('Test User');
    
    // Click the payment button
    const payButton = wrapper.find('button.btn-primary');
    await payButton.trigger('click');
    
    // Check loading state
    expect(payButton.text()).toBe('处理中...');
    
    // Fast-forward timer past the payment delay
    vi.advanceTimersByTime(2000);
    await flushPromises();
    
    // Check API call
    expect(axios.post).toHaveBeenCalledWith('/api/seats/confirm', {
      eventId: testEventId,
      seatIds: testSeatIds
    });
    
    // Check navigation to confirmation page
    expect(router.currentRoute.value.name).toBe('booking-confirmation');
    expect(router.currentRoute.value.params.eventId).toBe(testEventId);
    expect(router.currentRoute.value.query.seats).toBe('1,2');
  });

  it('handles payment failure', async () => {
    // Mock payment failure
    axios.post.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          data: {
            message: '支付处理失败'
          }
        }
      });
    });
    
    await flushPromises();
    
    // Click the payment button
    const payButton = wrapper.find('button.btn-primary');
    await payButton.trigger('click');
    
    // Fast-forward timer
    vi.advanceTimersByTime(2000);
    await flushPromises();
    
    // Check error message
    expect(wrapper.find('.alert-danger').exists()).toBe(true);
    expect(wrapper.find('.alert-danger').text()).toContain('支付处理失败');
    
    // Should stay on payment page
    expect(router.currentRoute.value.name).toBe('payment');
  });

  it('cancels booking and releases seats', async () => {
    await flushPromises();
    
    // Click the cancel button
    const cancelButton = wrapper.find('button.btn-outline-secondary');
    await cancelButton.trigger('click');
    await flushPromises();
    
    // Check API call
    expect(axios.post).toHaveBeenCalledWith('/api/seats/release-locks', {
      eventId: testEventId,
      seatIds: testSeatIds
    });
    
    // Check navigation back to event details page
    expect(router.currentRoute.value.name).toBe('event-details');
    expect(router.currentRoute.value.params.id).toBe(testEventId);
  });

  it('redirects to event page when timer expires', async () => {
    await flushPromises();
    
    // Set remaining time to 1 second
    wrapper.vm.timeRemaining = 1;
    
    // Advance timer to expire the lock
    vi.advanceTimersByTime(1500);
    await flushPromises();
    
    // Check error message
    expect(wrapper.find('.alert-danger').exists()).toBe(true);
    expect(wrapper.find('.alert-danger').text()).toContain('座位锁定已过期');
    
    // Advance timer to allow redirect to occur
    vi.advanceTimersByTime(3500);
    await flushPromises();
    
    // Check navigation back to event details page
    expect(router.currentRoute.value.name).toBe('event-details');
    expect(router.currentRoute.value.params.id).toBe(testEventId);
  });

  it('changes payment method display based on selection', async () => {
    await flushPromises();
    
    // Check credit card form is visible by default
    expect(wrapper.find('.credit-card-form').exists()).toBe(true);
    expect(wrapper.find('.qr-payment').exists()).toBe(false);
    
    // Switch to Alipay
    await wrapper.find('#alipay').setValue(true);
    await wrapper.vm.$nextTick();
    
    // Check QR code display is visible
    expect(wrapper.find('.credit-card-form').exists()).toBe(false);
    expect(wrapper.find('.qr-payment').exists()).toBe(true);
    expect(wrapper.find('.qr-payment img').attributes('src')).toBe('/images/alipay-qr.png');
    
    // Switch to WeChat
    await wrapper.find('#wechat').setValue(true);
    await wrapper.vm.$nextTick();
    
    // Check WeChat QR code
    expect(wrapper.find('.qr-payment img').attributes('src')).toBe('/images/wechat-qr.png');
  });

  it('formats date and time correctly', () => {
    expect(wrapper.vm.formatDate('2023-06-01T19:00:00')).toMatch(/2023年/);
    expect(wrapper.vm.formatTime('2023-06-01T19:00:00')).toMatch(/19:/);
  });
}); 