<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
    <UContainer class="space-y-8 max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 class="text-2xl sm:text-3xl font-semibold">Inspection Form</h1>

        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <UInput
            v-model="newRoomName"
            placeholder="New Room Name"
            size="sm"
            class="w-full sm:w-48"
          />
          <UButton
            @click="addRoom"
            color="primary"
            :disabled="!newRoomName.trim()"
            class="w-full sm:w-auto"
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

              <div class="flex items-center gap-3">
                <UInput
                  v-model="newSectionNames[roomName]"
                  placeholder="New Section Name"
                  size="sm"
                  class="w-48"
                />
                <UButton
                  size="sm"
                  @click="addSection(roomName)"
                  :disabled="!newSectionNames[roomName]?.trim()"
                >
                  + Add Section
                </UButton>
                <UButton
                  icon="i-heroicons-trash"
                  color="error"
                  variant="soft"
                  size="sm"
                  @click="removeRoom(roomName)"
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
                    @click="removeSection(roomName, sectionName)"
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
</template>


<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as Y from 'yjs'
import type { RadioGroupItem } from '@nuxt/ui'

useHead({ htmlAttrs: { class: 'dark' } }) // Force dark mode

const route = useRoute()
const docId = route.query.docId as string

console.log(route)

const doc = new Y.Doc()
// const websocketUrl = import.meta.env.VITE_WS_URL
const config = useRuntimeConfig();
const ws = new WebSocket(`${config.public.wsUrl}/?docId=${docId}`)

ws.binaryType = 'arraybuffer'

const yRooms = doc.getMap<Y.Map<Y.Map<any>>>('rooms')
const rooms = ref<Map<string, Y.Map<Y.Map<any>>>>(new Map())

const newRoomName = ref('')
const newSectionNames = reactive<Record<string, string>>({})
const newFields = reactive<Record<string, Record<string, { key: string; value: string }>>>({})

const conditionOptions = ref<RadioGroupItem[]>(['Good', 'Fair', 'Poor', 'None', 'N/A'])

ws.onopen = () => {
  console.log('WebSocket connected')
}

ws.onmessage = (event) => {
  console.log("On Message: ", event)
  const update = new Uint8Array(event.data as ArrayBuffer)
  Y.applyUpdate(doc, update)
}

doc.on('update', update => {
  console.log("doc update: ", update)
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
  const defaults = ['condition', 'materials', 'location', 'pictures', 'observations']
  for (const key of defaults) {
    if (!section.has(key)) section.set(key, '')
  }
}

const syncRooms = () => {
  rooms.value = new Map(yRooms.entries())

  rooms.value.forEach((roomMap, roomName) => {
    roomMap.forEach((section, sectionName) => {
      ensureNewField(roomName, sectionName)
    })
  })
}

onMounted(() => {
  const route = useRoute()
  yRooms.observeDeep(syncRooms)
  syncRooms()
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

</script>
