<template>
  <div class="staff-page">
    <h2>Staff Management</h2>
    <!-- Search Bar and Add Button -->
    <div class="toolbar">
      <input v-model="search" class="search-input" placeholder="Search by staff name..." />
      <button class="add-btn" @click="openAddModal">Add Staff</button>
    </div>

    <!-- Staff Table -->
    <div class="staff-table-wrapper">
      <table class="staff-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NAME</th>
            <th>E-mail ADDRESS</th>
            <th>Group</th>
            <th>Assigned Event</th>
            <th>STATUS</th>
            <th>Operation</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="staff in pagedStaff" :key="staff.id">
            <td>{{ staff.id }}</td>
            <td>{{ staff.name }}</td>
            <td>{{ staff.email }}</td>
            <td>{{ staff.group }}</td>
            <td>{{ staff.event }}</td>
            <td><span class="status onsite">On site</span></td>
            <td>
              <button class="op-btn edit" @click="openEditModal(staff)">edit</button>
              <button class="op-btn delete" @click="openDeleteModal(staff)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination (dynamic) -->
    <div class="pagination">
      <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Prev</button>
      <button v-for="page in pageCount" :key="page" :class="{ active: currentPage === page }" @click="goToPage(page)">{{ page }}</button>
      <button :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">Next</button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <h3>{{ modalType === 'add' ? 'Add Staff' : 'Edit Staff' }}</h3>
          <input v-model="modalStaff.name" placeholder="Name" class="modal-input" />
          <input v-model="modalStaff.email" placeholder="Email" class="modal-input" />
          <select v-model="modalStaff.role" class="modal-input">
            <option>Admin</option>
            <option>Manager</option>
            <option>Staff</option>
          </select>
          <select v-model="modalStaff.status" class="modal-input">
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <div class="modal-actions">
            <button class="save-btn" @click="saveStaff">Save</button>
            <button class="close-btn" @click="closeModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <h3>Delete Staff</h3>
          <p>Are you sure you want to delete <b>{{ modalStaff.name }}</b>?</p>
          <div class="modal-actions">
            <button class="delete-btn" @click="confirmDelete">Delete</button>
            <button class="close-btn" @click="closeDeleteModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalType = ref('add') // 'add' or 'edit'
const modalStaff = ref({ id: null, name: '', email: '', role: 'Staff', status: 'Active' })
const staffList = ref([
  { id: '00001', name: 'Alice Smith', email: 'alice@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Admin', status: 'Active' },
  { id: '00002', name: 'Bob Johnson', email: 'bob@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00003', name: 'Charlie Lee', email: 'charlie@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00004', name: 'Diana King', email: 'diana@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00005', name: 'Ethan Brown', email: 'ethan@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00006', name: 'Fiona White', email: 'fiona@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00007', name: 'George Black', email: 'george@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Admin', status: 'Active' },
  { id: '00008', name: 'Hannah Green', email: 'hannah@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00009', name: 'Ian Blue', email: 'ian@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00010', name: 'Jane Red', email: 'jane@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00011', name: 'Kevin Gray', email: 'kevin@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00012', name: 'Linda Pink', email: 'linda@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00013', name: 'Mike Yellow', email: 'mike@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Admin', status: 'Active' },
  { id: '00014', name: 'Nina Purple', email: 'nina@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00015', name: 'Oscar Gold', email: 'oscar@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00016', name: 'Paula Silver', email: 'paula@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00017', name: 'Quinn Bronze', email: 'quinn@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00018', name: 'Rachel Copper', email: 'rachel@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00019', name: 'Sam Jade', email: 'sam@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Admin', status: 'Active' },
  { id: '00020', name: 'Tina Ruby', email: 'tina@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00021', name: 'Uma Emerald', email: 'uma@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00022', name: 'Victor Sapphire', email: 'victor@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00023', name: 'Wendy Topaz', email: 'wendy@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Admin', status: 'Active' },
  { id: '00024', name: 'Xander Pearl', email: 'xander@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00025', name: 'Yara Opal', email: 'yara@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00026', name: 'Zane Quartz', email: 'zane@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00027', name: 'Amy Amber', email: 'amy@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00028', name: 'Brian Garnet', email: 'brian@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Manager', status: 'Inactive' },
  { id: '00029', name: 'Cathy Jade', email: 'cathy@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Staff', status: 'Active' },
  { id: '00030', name: 'David Onyx', email: 'david@example.com', group: 'Expert group', event: 'Thick and Thin', role: 'Admin', status: 'Active' },
])

const currentPage = ref(1)
const pageSize = 10
const pageCount = computed(() => Math.ceil(filteredStaff.value.length / pageSize))
const pagedStaff = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStaff.value.slice(start, start + pageSize)
})

const filteredStaff = computed(() => {
  if (!search.value) return staffList.value
  return staffList.value.filter(s => s.name.toLowerCase().includes(search.value.toLowerCase()))
})

function openAddModal() {
  modalType.value = 'add'
  modalStaff.value = { id: null, name: '', email: '', role: 'Staff', status: 'Active' }
  showModal.value = true
}
function openEditModal(staff) {
  modalType.value = 'edit'
  modalStaff.value = { ...staff }
  showModal.value = true
}
function closeModal() {
  showModal.value = false
}
function saveStaff() {
  // Static: just close modal, no real save
  showModal.value = false
}
function openDeleteModal(staff) {
  modalStaff.value = { ...staff }
  showDeleteModal.value = true
}
function closeDeleteModal() {
  showDeleteModal.value = false
}
function confirmDelete() {
  // Static: just close modal, no real delete
  showDeleteModal.value = false
}
function goToPage(page) {
  if (page >= 1 && page <= pageCount.value) {
    currentPage.value = page
  }
}
</script>

<style scoped>
.staff-page {
  padding: 0 0 0 16px;
  font-family: 'ABeeZee', sans-serif;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}
.search-input {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #ccc;
  width: 240px;
}
.add-btn {
  background: #16c2b8;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  font-weight: bold;
  cursor: pointer;
}
.staff-table-wrapper {
  margin: 40px auto 0 auto;
  max-width: 1200px;
  background: #fafafd;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  padding: 32px 18px;
}
.staff-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  font-family: 'ABeeZee', sans-serif;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.staff-table th, .staff-table td {
  padding: 16px 18px;
  text-align: left;
}
.staff-table th {
  background: #fafafd;
  color: #222;
  font-weight: bold;
  font-size: 15px;
  border-bottom: 2px solid #f0f0f0;
}
.staff-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
}
.status.onsite {
  background: #c8f2e0;
  color: #2e7d5a;
  border-radius: 12px;
  padding: 4px 18px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}
.op-btn {
  border: 1.5px solid #1976d2;
  background: #fff;
  color: #1976d2;
  border-radius: 12px;
  padding: 6px 18px;
  font-size: 15px;
  font-weight: 500;
  margin-right: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.op-btn:last-child {
  margin-right: 0;
}
.op-btn:hover {
  background: #1976d2;
  color: #fff;
}
.op-btn.delete {
  border: 1.5px solid #e14a82;
  color: #e14a82;
}
.op-btn.delete:hover {
  background: #e14a82;
  color: #fff;
}
.pagination {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
.pagination button {
  border: none;
  background: #f0f0f0;
  color: #333;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
}
.pagination .active {
  background: #16c2b8;
  color: white;
}
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-wrapper {
  box-shadow: 0 2px 8px rgba(0,0,0,0.33);
}
.modal-container {
  background: #fff;
  padding: 30px 40px;
  border-radius: 8px;
  text-align: center;
  min-width: 320px;
}
.modal-input {
  display: block;
  width: 100%;
  margin: 12px 0;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.modal-actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 16px;
}
.save-btn, .close-btn {
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  font-size: 14px;
  cursor: pointer;
}
.save-btn {
  background: #16c2b8;
  color: white;
}
.close-btn {
  background: #f0f0f0;
  color: #333;
}
</style>