<template>
  <div class="messages-layout">
    <!-- Contact List -->
    <aside class="contacts">
      <div v-for="(contact, idx) in contacts" :key="contact.id" :class="['contact-item', {active: idx === selectedContact}]" @click="selectedContact = idx">
        <img :src="contact.avatar" class="contact-avatar" />
        <div class="contact-info">
          <div class="contact-name">{{ contact.name }}</div>
          <div class="contact-summary">{{ contact.summary }}</div>
        </div>
      </div>
    </aside>
    <!-- Chat Window -->
    <section class="chat-panel">
      <div class="chat-header">
        <div>
          <div class="chat-contact-name">{{ currentContact.name }}</div>
          <div class="chat-status">Online</div>
        </div>
        <button class="chat-menu"><i class="fas fa-ellipsis-v"></i></button>
      </div>
      <div class="chat-body">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['chat-bubble', msg.fromMe ? 'me' : 'other']">
          <span class="bubble-content">{{ msg.text }}</span>
          <span class="bubble-time">00:08</span>
        </div>
      </div>
      <div class="chat-input-bar">
        <input v-model="input" class="chat-input" placeholder="Can I help You?" />
        <button class="send-btn"><i class="fas fa-paper-plane"></i></button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const contacts = [
  { id: 1, name: 'Contact Name', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', summary: 'Non in semper nisi adipiscing s...' },
  { id: 2, name: 'Contact Name', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', summary: 'Non in semper nisi adipiscing s...' },
  { id: 3, name: 'Contact Name', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', summary: 'Non in semper nisi adipiscing s...' },
  { id: 4, name: 'Contact Name', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', summary: 'Non in semper nisi adipiscing s...' },
  { id: 5, name: 'Contact Name', avatar: 'https://randomuser.me/api/portraits/women/47.jpg', summary: 'Non in semper nisi adipiscing s...' },
  { id: 6, name: 'Contact Name', avatar: 'https://randomuser.me/api/portraits/men/48.jpg', summary: 'Non in semper nisi adipiscing s...' },
]
const selectedContact = ref(0)
const currentContact = computed(() => contacts[selectedContact.value])

const messages = [
  { text: 'Hello!', fromMe: false },
  { text: 'Hi', fromMe: true },
  { text: "How're you doing?", fromMe: false },
  { text: "I'm fine, and you?", fromMe: true },
  { text: "I'm cool too! Let's go camping tomorrow? Everybody will be there!", fromMe: false },
  { text: "That's would be nice!", fromMe: true },
  { text: "I'm in.", fromMe: true },
]
const input = ref('')
</script>

<style scoped>
.messages-layout {
  display: flex;
  height: 80vh;
  background: #fafafd;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  margin: 40px auto 0 auto;
  max-width: 1100px;
  min-width: 900px;
  overflow: hidden;
}
.contacts {
  width: 300px;
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  gap: 8px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-radius: 12px;
  cursor: pointer;
  background: #fff;
  transition: background 0.2s;
  margin: 0 12px;
}
.contact-item.active {
  background: #f25c94;
  color: #fff;
}
.contact-item.active .contact-name,
.contact-item.active .contact-summary {
  color: #fff;
}
.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.contact-info {
  flex: 1;
  min-width: 0;
}
.contact-name {
  font-weight: bold;
  font-size: 16px;
  color: #222;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.contact-summary {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fafafd;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 32px 12px 32px;
  border-bottom: 1px solid #e0e0e0;
}
.chat-contact-name {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 2px;
}
.chat-status {
  font-size: 13px;
  color: #4caf50;
}
.chat-menu {
  background: none;
  border: none;
  font-size: 20px;
  color: #888;
  cursor: pointer;
}
.chat-body {
  flex: 1;
  padding: 32px 32px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #f8f8fa;
  border-radius: 0 0 18px 18px;
  overflow-y: auto;
}
.chat-bubble {
  max-width: 60%;
  padding: 10px 18px;
  border-radius: 18px;
  font-size: 15px;
  display: inline-block;
  position: relative;
  margin-bottom: 2px;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.chat-bubble.me {
  align-self: flex-end;
  background: #f25c94;
  color: #fff;
  border-bottom-right-radius: 6px;
}
.chat-bubble.other {
  align-self: flex-start;
  background: #7c4dff;
  color: #fff;
  border-bottom-left-radius: 6px;
}
.bubble-content {
  display: inline;
}
.bubble-time {
  font-size: 11px;
  color: #fff;
  margin-left: 8px;
  opacity: 0.7;
}
.chat-input-bar {
  display: flex;
  align-items: center;
  padding: 18px 32px;
  border-top: 1px solid #e0e0e0;
  background: #fafafd;
  border-radius: 0 0 18px 18px;
}
.chat-input {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 12px 18px;
  font-size: 15px;
  background: #fff;
  margin-right: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.send-btn {
  background: none;
  border: none;
  color: #f25c94;
  font-size: 22px;
  cursor: pointer;
  padding: 0 8px;
}
</style>