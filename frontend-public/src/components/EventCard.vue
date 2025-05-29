<template>
  <div class="event-card" @click="goToEvent">
    <!-- Image -->
    <div class="image-wrapper">
      <img :src="imageUrl" alt="Event Cover" class="event-image" />
      <span v-if="isFree" class="free-badge">FREE</span>
    </div>

    <!-- Title -->
    <h3 class="event-title">
      {{ title }}
    </h3>

    <!-- Time -->
    <p class="event-time">
      {{ time }}
    </p>

    <!-- Type -->
    <p class="event-type">
      {{ type }}
    </p>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'EventCard',
  props: {
    id: { type: [String, Number], required: true },
    imageUrl: { type: String, required: true },
    title: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, required: true },
    isFree: { type: Boolean, default: false }
  },
  setup(props) {
    const router = useRouter()

    const goToEvent = () => {
      router.push(`/events/${props.id}`) // ✅ 正确路径
    }

    return { goToEvent }
  }
})
</script>


<style scoped>
.event-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: 'ABeeZee', sans-serif;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.free-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: #eee5ff;
  color: #8658dc;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 16px 6px;
  color: #111;
}

.event-time {
  font-size: 14px;
  color: #7d41e1;
  margin: 0 16px 4px;
  font-weight: 500;
}

.event-type {
  font-size: 13px;
  color: #777;
  margin: 0 16px 16px;
}
</style>
