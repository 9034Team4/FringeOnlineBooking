<template>
  <div class="venue-page">
    <img src="@/assets/images/venue-banner.png" alt="Venue Banner" class="banner" />

    <section class="venue-info">
      <h1>Adelaide Oval</h1>
      <p>
        Want guaranteed access to every Showdown and exclusive access to the members only David Hookes Bar? The 'Ultimate Football Membership' provides all this and more. Secure access to unreserved seating at all Adelaide Crows & Port Adelaide home games. Enjoy expanded Members' reciprocal rights with greater access to footy stadiums around the country. And when it comes to the local competition, take your pick of SANFL finals games. Members also have the option to purchase and upgrade to a Season Reserved Seat (waitlist currently in place) or purchase a Daily Reserved Seat on a game-by-game basis. Check out the full range of benefits
      </p>
    </section>

    <section class="event-section">
      <h2>Venue <span class="highlight">Events</span></h2>
      <div class="events-grid">
        <div class="event-card" v-for="i in 6" :key="i">
          <img src="@/assets/images/event-0.png" alt="Event" />
          <div class="info">
            <h3>BestSeller Book Bootcamp</h3>
            <p>Saturday, March 18, 9.30PM</p>
            <p>ONLINE EVENT – Attend anywhere</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'VenueDetailsPage'
}
</script>

<style scoped>
.venue-page {
  padding: 2rem;
  background: #f8f8f8;
}

.banner {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 2rem;
  object-fit: cover;
}

.venue-info h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.venue-info p {
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
}

.event-section {
  margin-top: 3rem;
}

.event-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.highlight {
  color: #f25c94;
}

.events-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.event-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
}

.event-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.event-card .info {
  padding: 1rem;
}

.event-card h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.event-card p {
  font-size: 0.9rem;
  color: #666;
  margin: 0.25rem 0;
}
</style>

