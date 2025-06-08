import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SeatManagementPage from '@/views/SeatManagementPage.vue';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock window.alert and window.confirm
window.alert = vi.fn();
window.confirm = vi.fn();

describe('SeatManagementPage.vue', () => {
  let wrapper;
  
  // Mock data
  const mockVenues = [
    { id: 1, name: '测试场馆1' },
    { id: 2, name: '测试场馆2' }
  ];
  
  const mockEvents = [
    { id: 101, title: '测试活动1', venueId: 1 },
    { id: 102, title: '测试活动2', venueId: 1 }
  ];
  
  const mockSeats = [
    { id: 1001, row: 'A', seatNumber: '1', status: 'available', section: 'Main', price: 50 },
    { id: 1002, row: 'A', seatNumber: '2', status: 'locked', section: 'Main', price: 50, lockBy: 'user1', lockTime: '2023-06-01T19:00:00', remainingLockTime: 120 },
    { id: 1003, row: 'A', seatNumber: '3', status: 'booked', section: 'Main', price: 50 },
    { id: 1004, row: 'B', seatNumber: '1', status: 'available', section: 'VIP', price: 100 },
    { id: 1005, row: 'B', seatNumber: '2', status: 'available', section: 'VIP', price: 100 },
  ];
  
  const mockUsers = [
    { id: 'user1', name: '测试用户1' },
    { id: 'user2', name: '测试用户2' }
  ];
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock API responses
    axios.get.mockImplementation(url => {
      if (url === '/api/admin/venues') {
        return Promise.resolve({
          data: {
            success: true,
            data: mockVenues
          }
        });
      }
      if (url.includes('/api/admin/venues/1/events')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockEvents
          }
        });
      }
      if (url.includes('/api/events/101/seats')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSeats
          }
        });
      }
      if (url.includes('/api/seats/lock-status')) {
        return Promise.resolve({
          data: {
            success: true,
            data: mockSeats.map(s => ({
              id: s.id,
              status: s.status,
              remainingLockTime: s.status === 'locked' ? s.remainingLockTime : null
            }))
          }
        });
      }
      if (url === '/api/admin/users') {
        return Promise.resolve({
          data: {
            success: true,
            data: mockUsers
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    // Mock successful API calls
    axios.post.mockImplementation((url) => {
      if (url === '/api/admin/seats/release-expired') {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Released expired locks',
            data: { count: 2, releasedSeats: [1002] }
          }
        });
      }
      if (url === '/api/admin/seats/release') {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Seat lock released'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    // Mount component
    wrapper = mount(SeatManagementPage);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('loads venues when mounted', async () => {
    await flushPromises();
    
    // Check API calls
    expect(axios.get).toHaveBeenCalledWith('/api/admin/venues');
    
    // Check venues in select
    const venueOptions = wrapper.findAll('#venueSelect option');
    expect(venueOptions.length).toBe(mockVenues.length + 1); // +1 for default option
    expect(venueOptions[1].text()).toBe('测试场馆1');
    expect(venueOptions[2].text()).toBe('测试场馆2');
  });
  
  it('loads events when venue is selected', async () => {
    await flushPromises();
    
    // Select venue
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    
    // Check API calls
    expect(axios.get).toHaveBeenCalledWith('/api/admin/venues/1/events');
    
    // Check events in select
    const eventOptions = wrapper.findAll('#eventSelect option');
    expect(eventOptions.length).toBe(mockEvents.length + 1); // +1 for default option
    expect(eventOptions[1].text()).toBe('测试活动1');
    expect(eventOptions[2].text()).toBe('测试活动2');
  });
  
  it('loads seats when event is selected', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Check API calls
    expect(axios.get).toHaveBeenCalledWith('/api/events/101/seats');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/seats/lock-status'));
    
    // Check seats are rendered
    const seatElements = wrapper.findAll('.seat');
    expect(seatElements.length).toBe(mockSeats.length);
    
    // Check seat row labels
    const rowLabels = wrapper.findAll('.row-label');
    expect(rowLabels.length).toBe(2); // A and B rows
    expect(rowLabels[0].text()).toBe('A');
    expect(rowLabels[1].text()).toBe('B');
  });
  
  it('filters seats by status', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Check all seats are visible by default
    expect(wrapper.findAll('.seat').length).toBe(mockSeats.length);
    
    // Filter by available status
    await wrapper.find('#statusFilter').setValue('available');
    await flushPromises();
    
    // Check only available seats are visible
    expect(wrapper.findAll('.seat').length).toBe(3); // 3 available seats
    expect(wrapper.findAll('.seat.available').length).toBe(3);
    
    // Filter by locked status
    await wrapper.find('#statusFilter').setValue('locked');
    await flushPromises();
    
    // Check only locked seats are visible
    expect(wrapper.findAll('.seat').length).toBe(1); // 1 locked seat
    expect(wrapper.findAll('.seat.locked').length).toBe(1);
    
    // Filter by booked status
    await wrapper.find('#statusFilter').setValue('booked');
    await flushPromises();
    
    // Check only booked seats are visible
    expect(wrapper.findAll('.seat').length).toBe(1); // 1 booked seat
    expect(wrapper.findAll('.seat.booked').length).toBe(1);
  });
  
  it('shows seat details when seat is selected', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Select a locked seat
    const lockedSeat = wrapper.findAll('.seat.locked')[0];
    await lockedSeat.trigger('click');
    
    // Check seat details are displayed
    expect(wrapper.text()).toContain('座位 A-2');
    expect(wrapper.text()).toContain('ID: 1002');
    expect(wrapper.text()).toContain('价格: $50.00');
    expect(wrapper.text()).toContain('状态: 已锁定');
    expect(wrapper.text()).toContain('锁定用户: 测试用户1');
    expect(wrapper.text()).toContain('剩余时间: 2:00');
    
    // Check release button is available
    expect(wrapper.find('button.btn-warning').exists()).toBe(true);
    expect(wrapper.find('button.btn-warning').text()).toContain('手动释放锁定');
  });
  
  it('displays seat statistics correctly', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Check statistics
    const statsItems = wrapper.findAll('.stats-item');
    
    // Total seats
    expect(statsItems[0].text()).toContain('总座位数');
    expect(statsItems[0].text()).toContain('5');
    
    // Available seats
    expect(statsItems[1].text()).toContain('可用座位');
    expect(statsItems[1].text()).toContain('3');
    
    // Locked seats
    expect(statsItems[2].text()).toContain('锁定座位');
    expect(statsItems[2].text()).toContain('1');
    
    // Booked seats
    expect(statsItems[3].text()).toContain('已预订座位');
    expect(statsItems[3].text()).toContain('1');
  });
  
  it('releases expired locks when button is clicked', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Click release expired locks button
    const releaseButton = wrapper.findAll('button')[1]; // Second button in header
    expect(releaseButton.text()).toContain('释放过期锁定');
    await releaseButton.trigger('click');
    await flushPromises();
    
    // Check API call
    expect(axios.post).toHaveBeenCalledWith('/api/admin/seats/release-expired');
    
    // Check alert was shown
    expect(window.alert).toHaveBeenCalledWith('成功释放 2 个过期锁定的座位');
    
    // Check seats are reloaded
    expect(axios.get).toHaveBeenCalledWith('/api/events/101/seats');
  });
  
  it('releases specific seat lock when button is clicked', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Select a locked seat
    const lockedSeat = wrapper.findAll('.seat.locked')[0];
    await lockedSeat.trigger('click');
    
    // Mock confirm dialog to return true
    window.confirm.mockReturnValueOnce(true);
    
    // Click release lock button
    const releaseButton = wrapper.find('button.btn-warning');
    await releaseButton.trigger('click');
    await flushPromises();
    
    // Check confirm was shown
    expect(window.confirm).toHaveBeenCalledWith('确定要释放座位 A-2 的锁定吗？');
    
    // Check API call
    expect(axios.post).toHaveBeenCalledWith('/api/admin/seats/release', {
      eventId: '101',
      seatIds: [1002]
    });
    
    // Check alert was shown
    expect(window.alert).toHaveBeenCalledWith('座位锁定已释放');
    
    // Check seats are reloaded
    expect(axios.get).toHaveBeenCalledWith('/api/events/101/seats');
  });
  
  it('cancels seat lock release when confirmed dialog is cancelled', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Select a locked seat
    const lockedSeat = wrapper.findAll('.seat.locked')[0];
    await lockedSeat.trigger('click');
    
    // Mock confirm dialog to return false
    window.confirm.mockReturnValueOnce(false);
    
    // Click release lock button
    const releaseButton = wrapper.find('button.btn-warning');
    await releaseButton.trigger('click');
    await flushPromises();
    
    // Check confirm was shown
    expect(window.confirm).toHaveBeenCalledWith('确定要释放座位 A-2 的锁定吗？');
    
    // Check API call was not made
    expect(axios.post).not.toHaveBeenCalledWith('/api/admin/seats/release', expect.anything());
  });
  
  it('refreshes seats when refresh button is clicked', async () => {
    await flushPromises();
    
    // Select venue and event
    await wrapper.find('#venueSelect').setValue('1');
    await flushPromises();
    await wrapper.find('#eventSelect').setValue('101');
    await flushPromises();
    
    // Clear previous API calls
    axios.get.mockClear();
    
    // Click refresh button
    const refreshButton = wrapper.findAll('button')[0]; // First button in header
    expect(refreshButton.text()).toContain('刷新');
    await refreshButton.trigger('click');
    await flushPromises();
    
    // Check seats are reloaded
    expect(axios.get).toHaveBeenCalledWith('/api/events/101/seats');
  });
  
  it('formats remaining time correctly', () => {
    expect(wrapper.vm.formatRemainingTime(65)).toBe('1:05');
    expect(wrapper.vm.formatRemainingTime(130)).toBe('2:10');
    expect(wrapper.vm.formatRemainingTime(3)).toBe('0:03');
  });
}); 