<template>
  <div class="ticket-container">
    <div class="ticket-card">
      <img class="event-image" src="@/assets/images/event-0.png" alt="Event Poster" />

      <div class="event-info">
        <h2>Open Community Exhibition</h2>
        <p class="venue">Nov 15 2023 ~ Gelora Bung Karno Stadium, Jakarta</p>
      </div>

      <hr />

      <div class="ticket-details">
        <div class="detail-pair">
          <div>
            <p class="label">Name</p>
            <p class="value">Indriyan Puspita</p>
          </div>
          <div>
            <p class="label">Order Number</p>
            <p class="value">CLD09738PL</p>
          </div>
        </div>

        <div class="detail-pair">
          <div>
            <p class="label">Date</p>
            <p class="value">Thu, 13 Feb - Fri, 11 Apr</p>
          </div>
          <div>
            <p class="label">Time</p>
            <p class="value">9:00 PM</p>
          </div>
        </div>

        <div class="detail-pair">
          <div>
            <p class="label">Gate</p>
            <p class="value">Yellow</p>
          </div>
          <div>
            <p class="label">Seat</p>
            <p class="value">West B</p>
          </div>
        </div>
      </div>

      <div class="barcode">
        <img src="@/assets/images/event-0.png" alt="Barcode" />
        <p class="barcode-note">Scan your barcode at the entry gate.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TicketView'
}
</script>

<style scoped>
.ticket-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(to bottom, #b0c9ff, #e5c3ff);
  min-height: 100vh;
}

.ticket-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  width: 340px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
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
</style>
