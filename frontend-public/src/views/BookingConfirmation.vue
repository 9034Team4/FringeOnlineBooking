<template>
  <div class="booking-confirmation">
    <div class="booking-content">
      <!-- Left Panel -->
      <div class="left-panel">
        <h2>Upcoming Event</h2>
        <div class="event-card selected">
          <img src="@/assets/images/event-0.png" alt="Event Thumbnail" />
          <div>
            <p class="datetime">Sun 16 July 2023 at 5:00pm</p>
            <h3>John Pedder: Woodblock Prints</h3>
            <p>Art Space at The Hotel Metropolitan</p>
          </div>
        </div>

        <h2>Past Event</h2>
        <div class="event-card">
          <img src="@/assets/images/event-0.png" alt="Event Thumbnail" />
          <div>
            <p class="datetime">Sun 16 July 2023 at 5:00pm</p>
            <h3>John Pedder: Woodblock Prints</h3>
            <p>Art Space at The Hotel Metropolitan</p>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="right-panel">
        <h3>Sun 16 July 2023 at 5:00pm</h3>
        <span class="status confirmed">Confirmed</span>

        <div class="event-details">
          <img src="@/assets/images/event-0.png" alt="Thumbnail" />
          <div>
            <h4>John Pedder: Woodblock Prints</h4>
            <p>MG Road, Bangalore</p>
            <p>Booking ref. #: 65742695</p>
          </div>
        </div>

        <div class="actions">
          <button class="action-btn">Directions</button>
          <button class="action-btn">Reschedule</button>
          <button class="action-btn cancel">Cancel</button>
        </div>

        <div class="summary">
          <h4>Art Space at The Hotel Metropolitan</h4>
          <p>1h</p>

          <div class="breakdown">
            <div class="line"><span>INR 900</span></div>
            <div class="line"><span>Taxes</span> <span>INR 0</span></div>
            <div class="line total"><span>Total</span> <span>INR 900</span></div>
          </div>

          <p class="cancellation">
            <strong>Cancellation policy</strong><br />
            Cancel for free anytime in advance, otherwise you will be charged <strong>100%</strong> of the service price for not showing up.
          </p>
        </div>

        <button class="send-btn" @click="goToTicket">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BookingConfirmation',
  methods: {
    goToTicket() {
      this.$router.push('/ticket')
    }
  }
}
</script>

<style scoped>
.booking-confirmation {
  padding: 2rem;
  background-color: #f9f9f9;
}

.booking-content {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.left-panel, .right-panel {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.left-panel {
  flex: 1;
}

.right-panel {
  flex: 2;
}

.event-card {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.event-card img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.event-card.selected {
  background-color: #fff0f5;
  border-left: 4px solid #f25c94;
}

.event-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
}

.event-details img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.status.confirmed {
  display: inline-block;
  background-color: #d4edda;
  color: #155724;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: #f3f3f3;
  cursor: pointer;
}

.action-btn.cancel {
  background-color: #fdecea;
  color: #d93025;
}

.summary {
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 8px;
}

.breakdown .line {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.breakdown .total {
  font-weight: bold;
  border-top: 1px solid #ccc;
}

.cancellation {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #555;
}

.send-btn {
  margin-top: 2rem;
  background-color: #f25c94;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
</style>
