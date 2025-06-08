import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SeatSelector from '@/components/SeatSelector.vue';
import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

// Mock vuex store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: 'test-user-id' }
  })
}));

// Mock axios
vi.mock('axios');

describe('SeatSelector.vue', () => {
  let router;
  let wrapper;
  
  // Sample test data
  const testEventId = 'test-event-id';
  const mockSeats = [
    { id: 1, row: 'A', seatNumber: '1', status: 'available', price: 50, isAccessible: false },
    { id: 2, row: 'A', seatNumber: '2', status: 'available', price: 50, isAccessible: false },
    { id: 3, row: 'A', seatNumber: '3', status: 'locked', price: 50, isAccessible: false },
    { id: 4, row: 'B', seatNumber: '1', status: 'available', price: 75, isAccessible: true },
    { id: 5, row: 'B', seatNumber: '2', status: 'booked', price: 75, isAccessible: false }
  ];

  beforeEach(() => {
    // Create a router instance
    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          name: 'home'
        },
        {
          path: '/login',
          name: 'login'
        },
        {
          path: '/payment/:eventId',
          name: 'payment'
        }
      ]
    });

    // Mock successful API response
    axios.get.mockImplementation(url => {
      if (url.includes('/seats')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSeats
          }
        });
      }
      if (url.includes('/lock-status')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSeats.map(seat => ({
              id: seat.id,
              status: seat.status,
              remainingLockTime: seat.status === 'locked' ? 250 : null
            }))
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock successful lock API
    axios.post.mockImplementation(() => {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Seats locked successfully'
        }
      });
    });

    // Create the component
    wrapper = mount(SeatSelector, {
      props: {
        eventId: testEventId
      },
      global: {
        plugins: [router],
        stubs: {
          transition: false
        }
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with loading state', async () => {
    const loadingWrapper = mount(SeatSelector, {
      props: {
        eventId: testEventId
      },
      global: {
        plugins: [router]
      }
    });
    
    expect(loadingWrapper.find('.loading-overlay').exists()).toBe(true);
    await flushPromises();
  });

  it('loads and displays seats', async () => {
    await flushPromises();
    
    expect(axios.get).toHaveBeenCalledWith(`/api/events/${testEventId}/seats`);
    expect(wrapper.findAll('.seat').length).toBe(mockSeats.length);
    
    // Check that rows are rendered
    expect(wrapper.findAll('.seat-row').length).toBe(2); // A and B rows
  });

  it('allows selecting available seats', async () => {
    await flushPromises();
    
    // Select an available seat
    const availableSeat = wrapper.findAll('.seat.available')[0];
    await availableSeat.trigger('click');
    
    // Check selected state
    expect(wrapper.vm.selectedSeatIds).toContain(1);
    expect(wrapper.findAll('.seat.selected').length).toBe(1);
    
    // Verify total price calculation
    expect(wrapper.vm.totalPrice).toBe(50);
  });

  it('prevents selecting locked or booked seats', async () => {
    await flushPromises();
    
    // Try to select a locked seat
    const lockedSeat = wrapper.find('.seat.locked');
    await lockedSeat.trigger('click');
    
    // Check no selection occurred
    expect(wrapper.vm.selectedSeatIds).not.toContain(3);
    
    // Try to select a booked seat
    const bookedSeat = wrapper.find('.seat.booked');
    await bookedSeat.trigger('click');
    
    // Check no selection occurred
    expect(wrapper.vm.selectedSeatIds).not.toContain(5);
  });

  it('allows deselecting a selected seat', async () => {
    await flushPromises();
    
    // Select then deselect a seat
    const availableSeat = wrapper.findAll('.seat.available')[0];
    await availableSeat.trigger('click');
    expect(wrapper.vm.selectedSeatIds).toContain(1);
    
    await availableSeat.trigger('click');
    expect(wrapper.vm.selectedSeatIds).not.toContain(1);
  });

  it('calculates total price correctly', async () => {
    await flushPromises();
    
    // Select two seats with different prices
    const firstSeat = wrapper.findAll('.seat.available')[0]; // Price: 50
    const secondSeat = wrapper.findAll('.seat.available')[1]; // Price: 50
    const thirdSeat = wrapper.findAll('.seat.available')[2]; // Price: 75
    
    await firstSeat.trigger('click');
    expect(wrapper.vm.totalPrice).toBe(50);
    
    await secondSeat.trigger('click');
    expect(wrapper.vm.totalPrice).toBe(100);
    
    await thirdSeat.trigger('click');
    expect(wrapper.vm.totalPrice).toBe(175);
  });

  it('locks seats and redirects to payment', async () => {
    await flushPromises();
    
    // Select seats
    const firstSeat = wrapper.findAll('.seat.available')[0];
    const secondSeat = wrapper.findAll('.seat.available')[1];
    await firstSeat.trigger('click');
    await secondSeat.trigger('click');
    
    // Click the continue button
    const continueButton = wrapper.find('button');
    await continueButton.trigger('click');
    
    await flushPromises();
    
    // Check API was called correctly
    expect(axios.post).toHaveBeenCalledWith('/api/seats/lock', {
      eventId: testEventId,
      seatIds: [1, 2]
    });
    
    // Check routing
    expect(router.currentRoute.value.name).toBe('payment');
    expect(router.currentRoute.value.params.eventId).toBe(testEventId);
    expect(router.currentRoute.value.query.seats).toBe('1,2');
  });

  it('displays accessible seat indicator', async () => {
    await flushPromises();
    
    // Find the accessible seat
    const accessibleSeat = wrapper.find('.seat.accessible');
    expect(accessibleSeat.exists()).toBe(true);
    expect(accessibleSeat.text()).toContain('1'); // B1 is accessible
  });

  it('formats remaining lock time correctly', () => {
    expect(wrapper.vm.formatRemainingTime(65)).toBe('1:05');
    expect(wrapper.vm.formatRemainingTime(130)).toBe('2:10');
    expect(wrapper.vm.formatRemainingTime(3)).toBe('0:03');
  });
}); 