<template>
  <div class="event-details-container">
    <div class="event-header">
      <img src="@/assets/images/event-0.png" alt="Event Banner" class="event-banner" />
      <div class="event-header-info">
        <h1>John Pedder: Woodblock Prints</h1>
        <div class="event-info-box">
          <p class="event-datetime">Saturday, March 18 2023, 9:30PM</p>
          <button class="book-btn" @click="goToBooking">Book now</button>
          <button class="secondary-btn" @click="goToVenue">Venue Information</button>
          <p class="refund-info">No Refunds</p>
        </div>
      </div>
    </div>

    <div class="event-content">
      <div class="left-column">
        <h2>Adelaide Oval</h2>
        <p class="description">
          DesignHub organized a 3D Modeling Workshop using Blender on 16th February at 5 PM...
        </p>

        <h3>Description</h3>
        <p>
          DesignHub organized a 3D Modeling Workshop using Blender on 16th February at 5 PM...
        </p>

        <h3>Hours</h3>
        <p>Weekdays hour: <strong>7PM - 10PM</strong></p>
        <p>Sunday hour: <strong>7PM - 10PM</strong></p>

        <h3>Organizer Contact</h3>
        <p>Please go to <a href="#">www.sneakypeeks.com</a> and refer the FAQ section for more detail</p>
      </div>

      <div class="right-column">
        <h3>Event location</h3>
        <GMapMap
          :center="{ lat: -34.9285, lng: 138.6007 }"
          :zoom="14"
          style="width: 100%; height: 300px"
        >
          <GMapMarker :position="{ lat: -34.9285, lng: 138.6007 }" />
        </GMapMap>
        <p><strong>Dream world wide in jakatra</strong></p>
        <p>Dummy Location generation model by RSU ... Our approach generates more realistic dummy locations</p>

        <h3>Tags</h3>
        <div class="tags">
          <span class="tag">Indonesia event</span>
          <span class="tag">Jaskaran event</span>
          <span class="tag">UI</span>
          <span class="tag">Seminar</span>
        </div>

        <h3>Share with friends</h3>
        <div class="social-icons">
          <img src="@/assets/logos/google.png" alt="Facebook" />
          <img src="@/assets/logos/spotify.png" alt="WhatsApp" />
          <img src="@/assets/logos/youtube.png" alt="LinkedIn" />
          <img src="@/assets/logos/zoom.png" alt="Twitter" />
        </div>
      </div>
    </div>

    <div class="related-events">
      <h2>Other events you may like</h2>
      <Upcoming/>
    </div>
  </div>
</template>

<script>
import Upcoming from '@/components/UpcomingEventFilters.vue'
import { GMapMap, GMapMarker } from '@fawmi/vue-google-maps'

export default {
  name: 'EventDetailsPage',
  components: {
    Upcoming,
    GMapMap,
    GMapMarker
  },
  methods: {
    // Navigate to booking confirmation
    goToBooking() {
      this.$router.push('/booking-confirmation')
    },
    // Navigate to venue details page
    goToVenue() {
      this.$router.push('/venue')
    }
  }
}
</script>


<style scoped>
.event-details-container {
  padding: 20px;
}

.event-header {
  display: flex;
  position: relative;
  margin-bottom: 30px;
}

.event-banner {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.event-header-info {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
  max-width: 300px;
}

.event-datetime {
  margin-bottom: 10px;
  font-weight: bold;
}

.book-btn {
  background: #f25c94;
  color: white;
  border: none;
  padding: 10px 20px;
  margin-bottom: 10px;
  border-radius: 6px;
  cursor: pointer;
}

.secondary-btn {
  background: #f5f5f5;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
}

.refund-info {
  font-size: 12px;
  color: #666;
}

.event-content {
  display: flex;
  gap: 40px;
}

.left-column, .right-column {
  flex: 1;
}

h2, h3 {
  margin-top: 20px;
}

.map-img {
  width: 100%;
  border-radius: 6px;
  margin-bottom: 10px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  background: #eee;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.social-icons img {
  width: 30px;
  margin-right: 10px;
}

.related-events {
  margin-top: 60px;
}
</style>