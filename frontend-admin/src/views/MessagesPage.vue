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
      </div>
      <div class="chat-body" ref="chatBodyRef">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['chat-bubble', msg.fromMe ? 'me' : 'other']">
          <span class="bubble-content">{{ msg.text }}</span>
          <span class="bubble-time">{{ msg.time }}</span>
        </div>
      </div>
      <div class="chat-input-bar">
        <input v-model="input" class="chat-input" placeholder="Can I help You?" @keyup.enter="sendMessage" />
        <button class="send-btn" @click="sendMessage"><i class="fas fa-paper-plane"></i></button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const contacts = [
  { id: 1, name: 'Alice Smith', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', summary: 'Let\'s catch up soon!' },
  { id: 2, name: 'Bob Johnson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', summary: 'Project update needed.' },
  { id: 3, name: 'Charlie Lee', avatar: 'https://randomuser.me/api/portraits/men/45.jpg', summary: 'Lunch this Friday?' },
  { id: 4, name: 'Diana King', avatar: 'https://randomuser.me/api/portraits/women/47.jpg', summary: 'Sent you the files.' },
  { id: 5, name: 'Ethan Brown', avatar: 'https://randomuser.me/api/portraits/men/48.jpg', summary: 'See you at the event.' },
  { id: 6, name: 'Fiona White', avatar: 'https://randomuser.me/api/portraits/women/60.jpg', summary: 'Let\'s review the plan.' },
]
const selectedContact = ref(0)
const currentContact = computed(() => contacts[selectedContact.value])

const allMessages = ref({
  1: [
    { text: 'Hi Alice! How are you?', fromMe: true, time: '09:01' },
    { text: 'Hey! I\'m good, thanks. You?', fromMe: false, time: '09:02' },
    { text: 'Doing well! Want to catch up this weekend?', fromMe: true, time: '09:03' },
    { text: 'Sure, let\'s do it!', fromMe: false, time: '09:04' },
  ],
  2: [
    { text: 'Bob, do you have the latest project update?', fromMe: true, time: '10:10' },
    { text: 'Yes, I\'ll send it over soon.', fromMe: false, time: '10:11' },
    { text: 'Thanks!', fromMe: true, time: '10:12' },
  ],
  3: [
    { text: 'Charlie, are you free for lunch this Friday?', fromMe: true, time: '11:20' },
    { text: 'Yes! Where shall we go?', fromMe: false, time: '11:21' },
    { text: 'How about the new Italian place?', fromMe: true, time: '11:22' },
    { text: 'Sounds great!', fromMe: false, time: '11:23' },
  ],
  4: [
    { text: 'Diana, did you get the files I sent?', fromMe: true, time: '13:00' },
    { text: 'Yes, received. Will review today.', fromMe: false, time: '13:01' },
    { text: 'Thanks!', fromMe: true, time: '13:02' },
  ],
  5: [
    { text: 'Ethan, are you coming to the event tonight?', fromMe: true, time: '15:10' },
    { text: 'Of course! See you there.', fromMe: false, time: '15:11' },
  ],
  6: [
    { text: 'Fiona, let\'s review the plan tomorrow.', fromMe: true, time: '16:30' },
    { text: 'Sure, what time?', fromMe: false, time: '16:31' },
    { text: '10am works for me.', fromMe: true, time: '16:32' },
    { text: 'Perfect, see you then!', fromMe: false, time: '16:33' },
  ],
})
const input = ref('')
const chatBodyRef = ref(null)

const messages = computed(() => allMessages.value[contacts[selectedContact.value].id])

function sendMessage() {
  const text = input.value.trim()
  if (!text) return
  const now = new Date()
  const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
  const id = contacts[selectedContact.value].id
  allMessages.value[id].push({ text, fromMe: true, time })
  input.value = ''
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.messages-layout {
  display: flex;
  height: 80vh;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  margin: 0 0 0 0;
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
  gap: 6px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-radius: 14px;
  cursor: pointer;
  background: #fff;
  transition: background 0.2s;
  margin: 0 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
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
.chat-body {
  flex: 1;
  padding: 32px 32px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #f8f8fa;
  border-radius: 0 0 24px 24px;
  overflow-y: auto;
}
.chat-bubble {
  max-width: 60%;
  padding: 12px 22px;
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
  background: #fff;
  border-radius: 0 0 24px 24px;
}
.chat-input {
  flex: 1;
  border: 1.5px solid #f25c94;
  border-radius: 14px;
  padding: 14px 20px;
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