<template>
  <div class="search-panel">
    <div class="form-group">
      <label for="eventType">Looking for</label>
      <select id="eventType" v-model="eventType">
        <option disabled value="">Choose event type</option>
        <option>Comedy</option>
        <option>Music</option>
        <option>Art</option>
      </select>
    </div>

    <div class="form-group">
      <label for="location">Location</label>
      <select id="location" v-model="location">
        <option disabled value="">Choose location</option>
        <option>Adelaide CBD</option>
        <option>Glenelg</option>
      </select>
    </div>

    <div class="form-group">
      <label for="dateTime">When</label>
      <input type="datetime-local" id="dateTime" v-model="dateTime" />
    </div>

    <button class="search-btn" @click="search">
      🔍
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const eventType = ref('')
const location = ref('')
const dateTime = ref('')
const router = useRouter()

function search() {
  router.push({
    path: '/events',
    query: {
      eventType: eventType.value,
      location: location.value,
      dateTime: dateTime.value
    }
  })
}
</script>

<style scoped>
.search-panel {
  user-select: none;
  position: absolute;
  bottom: -50px; /* Adjust this for how much it should float out */
  left: 50%;
  transform: translateX(-50%);

  width: 90%;               /* responsive width */
  max-width: 1200px;        /* never exceed 1200px */
  margin: 0 auto;           /* center horizontally */
  background-color: #7b45f5;
  padding: 24px;
  user-select: none;
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

label {
  color: white;
  font-weight: 500;
}

select,
input[type="datetime-local"] {
  padding: 10px 14px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  background-color: #f0f0f0;
  color: #1a1a1a;
}

.search-btn {
  background-color: #f25c94;
  color: white;
  font-size: 20px;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  cursor: pointer;
  height: 48px;
}

.search-btn:hover {
  background-color: #e14a82;
}
</style>
