<template>
  <div class="event-card" @click="goToEvent">
    <!-- Image -->
    <div class="image-wrapper">
      <img :src="image" alt="Event Cover" class="event-image" />
      <span v-if="price === 'Free'" class="free-badge">FREE</span>
      <div v-if="tags && tags.length > 0" class="tags-container">
        <span v-for="tag in displayTags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>

    <!-- Title -->
    <h3 class="event-title">
      {{ title }}
    </h3>

    <!-- Date -->
    <p class="event-date">
      <i class="event-icon">📅</i> {{ date }}
    </p>

    <!-- Location -->
    <p class="event-location">
      <i class="event-icon">📍</i> {{ location }}
    </p>
    
    <!-- Price -->
    <p class="event-price">
      <i class="event-icon">💲</i> {{ price }}
    </p>
    
    <!-- Category -->
    <p v-if="category" class="event-category">
      {{ category }}
    </p>
  </div>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'EventCard',
  props: {
    id: { type: [String, Number], required: true },
    image: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, default: '' },
    tags: { type: Array, default: () => [] }
  },
  setup(props) {
    const router = useRouter()
    
    // Only show up to 2 tags
    const displayTags = computed(() => {
      return props.tags?.slice(0, 2) || []
    })

    const goToEvent = () => {
      router.push(`/events/${props.id}`)
    }

    return { 
      goToEvent,
      displayTags
    }
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
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
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
  transition: transform 0.3s ease;
}

.event-card:hover .event-image {
  transform: scale(1.05);
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
  z-index: 1;
}

.tags-container {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.tag {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  margin: 12px 16px 10px;
  color: #111;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 42px;
}

.event-date {
  font-size: 14px;
  color: #555;
  margin: 0 16px 8px;
  display: flex;
  align-items: center;
}

.event-location {
  font-size: 14px;
  color: #555;
  margin: 0 16px 8px;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-price {
  font-size: 14px;
  color: #f25c94;
  font-weight: 600;
  margin: 0 16px 8px;
  display: flex;
  align-items: center;
}

.event-category {
  font-size: 13px;
  color: #777;
  margin: 0 16px 16px;
  background-color: #f5f5f5;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 16px;
}

.event-icon {
  margin-right: 6px;
  font-style: normal;
}
</style>
