export default {
  namespaced: true,
  state: () => ({
    cart: [],
    booking: null,
    loading: false,
    error: null
  }),
  mutations: {
    ADD_TO_CART(state, ticket) {
      state.cart.push(ticket)
    },
    REMOVE_FROM_CART(state, index) {
      state.cart.splice(index, 1)
    },
    CLEAR_CART(state) {
      state.cart = []
    },
    SET_BOOKING(state, booking) {
      state.booking = booking
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  actions: {
    async addToCart({ commit }, ticket) {
      commit('ADD_TO_CART', ticket)
    },
    async removeFromCart({ commit }, index) {
      commit('REMOVE_FROM_CART', index)
    },
    async clearCart({ commit }) {
      commit('CLEAR_CART')
    },
    async createBooking({ commit, state }) {
      commit('SET_LOADING', true)
      try {
        // TODO: Implement API call
        const booking = await fakeCreateBooking(state.cart)
        commit('SET_BOOKING', booking)
        commit('CLEAR_CART')
        return booking
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async getUserBookings() {
      // TODO: Replace with real API call
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockBookings = [
            {
              id: 'booking1',
              event: {
                id: 'event1',
                title: 'Mock Event 1',
                date: new Date().toISOString(),
                location: 'Adelaide Oval'
              },
              tickets: [
                { id: 'ticket1', price: 50 }
              ],
              total: 50,
              createdAt: new Date().toISOString(),
              canCancel: true
            }
          ]
          resolve(mockBookings)
        }, 500)
      })
    }
  },
  getters: {
    cartItems: state => state.cart,
    cartTotal: state => state.cart.reduce((total, item) => total + item.price, 0),
    currentBooking: state => state.booking,
    isLoading: state => state.loading,
    error: state => state.error
  }
}

// Temporary mock function
async function fakeCreateBooking(tickets) {
  return {
    id: Math.random().toString(36).substring(2, 9),
    tickets,
    total: tickets.reduce((sum, ticket) => sum + ticket.price, 0),
    date: new Date().toISOString()
  }
}
