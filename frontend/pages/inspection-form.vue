<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
    <UContainer class="space-y-8 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 class="text-2xl sm:text-3xl font-semibold">Inspection Form</h1>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <UInput
            v-model="newRoomName"
            placeholder="New Room Name"
            size="sm"
            class="flex-1 sm:w-48"
          />

          <!-- Icon button for mobile -->
          <UButton
            icon="i-heroicons-plus"
            @click="addRoom"
            color="primary"
            :disabled="!newRoomName.trim()"
            class="block sm:hidden w-10 justify-center"
            title="Add Room"
          />

          <!-- Text + icon button for desktop -->
          <UButton
            icon="i-heroicons-plus"
            @click="addRoom"
            color="primary"
            :disabled="!newRoomName.trim()"
            class="hidden sm:inline-flex"
          >
            + Add Room
          </UButton>
        </div>
      </div>

      <!-- Rooms -->
      <div v-for="[roomName, room] in rooms" :key="roomName" class="space-y-6">
        <UCard class="bg-gray-800 text-gray-100">
          <template #header>
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
              <div class="flex-1">
                <h2 class="text-xl font-bold">{{ roomName }}</h2>
              </div>

              <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <UInput
                  v-model="newSectionNames[roomName]"
                  placeholder="New Section Name"
                  size="sm"
                  class="flex-1 sm:w-48"
                />

                <!-- Add Section Button -->
                <UButton
                  icon="i-heroicons-plus"
                  size="sm"
                  @click="addSection(roomName)"
                  :disabled="!newSectionNames[roomName]?.trim()"
                  class="block sm:hidden w-10 justify-center"
                  title="Add Section"
                />
                <UButton
                  icon="i-heroicons-plus"
                  size="sm"
                  @click="addSection(roomName)"
                  :disabled="!newSectionNames[roomName]?.trim()"
                  class="hidden sm:inline-flex"
                >
                  + Add Section
                </UButton>

                <!-- Delete Room Button -->
                <UButton
                  icon="i-heroicons-trash"
                  color="error"
                  variant="soft"
                  size="sm"
                  @click="confirmRoomDelete(roomName)"
                  class="w-10 justify-center"
                  title="Delete Room"
                />
              </div>
            </div>
          </template>

          <!-- Sections -->
          <div
            v-for="[sectionName, section] in room.entries()"
            :key="sectionName"
            class="space-y-4 mt-4 overflow-x-auto"
          >
            <UCard class="bg-gray-700 min-w-[300px]">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-semibold">{{ sectionName }}</h3>
                  <UButton
                    icon="i-heroicons-trash"
                    color="error"
                    variant="soft"
                    size="xs"
                    @click="confirmSectionDelete(roomName, sectionName)"
                    class="w-8 justify-center"
                    title="Delete Section"
                  />
                </div>
              </template>

              <div class="space-y-3">
                <div
                  v-for="[fieldKey, value] in (section as Y.Map<any>).entries()"
                  :key="fieldKey"
                  class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4"
                >
                  <span class="w-full sm:w-32 font-medium">{{ fieldKey }}</span>

                  <!-- Render radio group for "condition" field -->
                  <div v-if="fieldKey === 'condition'" class="flex-1 w-full">
                    <URadioGroup
                      :modelValue="section.get(fieldKey) ?? ''"
                      :items="conditionOptions"
                      @update:modelValue="val => updateField(roomName, sectionName, fieldKey, val)"
                      orientation="horizontal"
                      color="secondary"
                      :ui="{ base: 'ring-gray-900' }"
                    />
                  </div>

                  <!-- Render picture uploader -->
                  <div v-else-if="fieldKey === 'pictures'" class="flex-1 w-full">
                    pictures uploader here
                  </div>

                  <!-- Default input for other fields -->
                  <UInput
                    v-else
                    :modelValue="value"
                    @update:modelValue="val => updateField(roomName, sectionName, fieldKey, val)"
                    size="sm"
                    class="flex-1 w-full"
                  />
                </div>
              </div>
            </UCard>
          </div>
        </UCard>
      </div>
    </UContainer>
  </div>
  <!-- Confirm Delete Room Modal -->
  <UModal v-model:open="showDeleteRoomModal">
    <template #header>
      <h2 class="text-lg font-semibold text-red-500">Delete Room</h2>
    </template>
     <template #body>
       <div>
         <p>Are you sure you want to delete the room <strong>{{ roomToDelete }}</strong> and all its sections?</p>
         <div class="flex justify-end gap-2">
           <UButton label="Delete" color="error" @click="deleteConfirmedRoom" />
         </div>
       </div>
     </template>
  </UModal>

  <!-- Confirm Delete Section Modal -->
  <UModal v-model:open="showDeleteSectionModal">
    <template #header>
      <h2 class="text-lg font-semibold text-red-500">Delete Section</h2>
    </template>
     <template #body>
       <div>
         <p>
           Are you sure you want to delete the section
           <strong>{{ sectionToDelete?.section }}</strong> in room
           <strong>{{ sectionToDelete?.room }}</strong>?
         </p>
         <div class="flex justify-end gap-2">
           <UButton label="Delete" color="error" @click="deleteConfirmedSection" />
         </div>
       </div>
     </template>
  </UModal>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as Y from 'yjs'
import type { RadioGroupItem } from '@nuxt/ui'

definePageMeta({ middleware: ['check-doc-id'] })

const route = useRoute()
const docId = route.query.docId as string

const doc = new Y.Doc()
const config = useRuntimeConfig();
const ws = new WebSocket(`${config.public.wsUrl}/?docId=${docId}`)

ws.binaryType = 'arraybuffer'

const yMetaData = doc.getMap<Y.Map<Y.Map<any>>>('metadata')

const yRooms = doc.getMap<Y.Map<Y.Map<any>>>('rooms')
const rooms = ref<Map<string, Y.Map<Y.Map<any>>>>(new Map())

const newRoomName = ref('')
const newSectionNames = reactive<Record<string, string>>({})
const newFields = reactive<Record<string, Record<string, { key: string; value: string }>>>({})

const conditionOptions = ref<RadioGroupItem[]>(['Good', 'Fair', 'Poor', 'None', 'N/A'])

const showDeleteRoomModal = ref(false)
const showDeleteSectionModal = ref(false)

const roomToDelete = ref<string | null>(null)
const sectionToDelete = ref<{ room: string; section: string } | null>(null)

ws.onopen = () => {
  console.log('WebSocket connected')
}

ws.onmessage = (event) => {
  const update = new Uint8Array(event.data as ArrayBuffer)
  Y.applyUpdate(doc, update)
}

doc.on('update', update => {
  ws.send(update)
})

function ensureNewField(roomName: string, sectionName: string) {
  if (!newFields[roomName]) {
    newFields[roomName] = {}
  }
  if (!newFields[roomName][sectionName]) {
    newFields[roomName][sectionName] = { key: '', value: '' }
  }
}

function ensureDefaultFields(room: Y.Map<Y.Map<any>>, sectionName: string) {
  const section = room.get(sectionName)
  if (!section) return
  const defaults = ['condition', 'materials', 'location', 'observations', 'pictures']
  for (const key of defaults) {
    if (!section.has(key)) section.set(key, '')
  }
}

const syncRooms = () => {
  rooms.value = new Map(yRooms.entries())

  rooms.value.forEach((roomMap, roomName) => {
    roomMap.forEach((section, sectionName) => {
      console.log(section)
      ensureNewField(roomName, sectionName)
    })
  })
}

onMounted(() => {
  yRooms.observeDeep(syncRooms)
  syncRooms()
  console.log(yMetaData)
})

function addRoom() {
  const name = newRoomName.value.trim()
  if (!name || yRooms.has(name)) return
  yRooms.set(name, new Y.Map<Y.Map<any>>())
  newRoomName.value = ''
}

function addSection(roomName: string) {
  const section = newSectionNames[roomName]?.trim()
  if (!section) return
  const roomMap = yRooms.get(roomName)
  if (roomMap && !roomMap.has(section)) {
    const sectionMap = new Y.Map()
    roomMap.set(section, sectionMap)
    ensureDefaultFields(roomMap, section)
    ensureNewField(roomName, section)
    newSectionNames[roomName] = ''
  }
}

function updateField(room: string, section: string, key: string, value: string) {
  const sectionMap = yRooms.get(room)?.get(section)
  if (sectionMap instanceof Y.Map) {
    sectionMap.set(key, value)
  }
}

function removeSection(roomName: string, sectionName: string) {
  const roomMap = yRooms.get(roomName)
  if (roomMap?.has(sectionName)) {
    roomMap.delete(sectionName)
  }
}

function removeRoom(roomName: string) {
  if (yRooms.has(roomName)) {
    yRooms.delete(roomName)
    delete newSectionNames[roomName]
    delete newFields[roomName]
  }
}

function confirmRoomDelete(roomName: string) {
  roomToDelete.value = roomName
  showDeleteRoomModal.value = true
}

function confirmSectionDelete(room: string, section: string) {
  sectionToDelete.value = { room, section }
  showDeleteSectionModal.value = true
}

function deleteConfirmedRoom() {
  if (roomToDelete.value) {
    removeRoom(roomToDelete.value)
    roomToDelete.value = null
    showDeleteRoomModal.value = false
  }
}

function deleteConfirmedSection() {
  if (sectionToDelete.value) {
    removeSection(sectionToDelete.value.room, sectionToDelete.value.section)
    sectionToDelete.value = null
    showDeleteSectionModal.value = false
  }
}

</script>
