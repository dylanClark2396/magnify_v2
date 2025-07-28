<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <UContainer class="space-y-8">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-semibold">Collaborative Form</h1>
        <UButton @click="addSection" color="primary">+ Add Section</UButton>
      </div>

      <div v-for="[sectionName, section] in sections" :key="sectionName">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-bold">{{ sectionName }}</h2>
              <UButton size="xs" @click="addRoom(sectionName)">+ Add Room</UButton>
            </div>
          </template>

          <div v-for="[roomName, room] in section.entries()" :key="roomName" class="space-y-4 mt-4">
            <UCard class="bg-gray-50">
              <template #header>
                <h3 class="text-lg font-semibold">{{ roomName }}</h3>
              </template>

              <div class="space-y-3">
                <div
                  v-for="[fieldKey, value] in (room as Y.Map<any>).entries()"
                  :key="fieldKey"
                  class="flex items-center gap-4"
                >
                  <span class="w-32 font-medium">{{ fieldKey }}</span>
                  <UInput
                    :modelValue="value"
                    @update:modelValue="val => updateField(sectionName, roomName, fieldKey, val)"
                    size="sm"
                    class="flex-1"
                  />
                </div>

                <!-- Add Field Inputs -->
                <div class="flex items-center gap-3 pt-2">
                  <UInput
                    placeholder="Field Key"
                    v-model="newFields[sectionName]?.[roomName]?.key"
                    size="sm"
                    class="w-1/3"
                  />
                  <UInput
                    placeholder="Value"
                    v-model="newFields[sectionName]?.[roomName]?.value"
                    size="sm"
                    class="w-2/3"
                  />
                  <UButton
                    size="sm"
                    color="primary"
                    @click="() => {
                      const nf = newFields[sectionName]?.[roomName]
                      if (nf?.key && nf.value) updateField(sectionName, roomName, nf.key, nf.value)
                    }"
                  >
                    + Add Field
                  </UButton>
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
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const route = useRoute()
const docId = route.params.docId as string

const ydoc = new Y.Doc()
const provider = new WebsocketProvider(`ws://localhost:8080?docId=${docId}`, docId, ydoc)
const ySections = ydoc.getMap<Y.Map<any>>('sections')
const sections = ref<Map<string, Y.Map<any>>>(new Map())

const syncSections = () => {
  sections.value = new Map(ySections.entries())
}

onMounted(() => {
  ySections.observeDeep(syncSections)
  syncSections()
})

function addSection() {
  const name = prompt('New section name:')
  if (!name || ySections.has(name)) return
  ySections.set(name, new Y.Map())
}

function addRoom(section: string) {
  const room = prompt('Room name:')
  if (!room) return
  const sectionMap = ySections.get(section)
  if (sectionMap && !sectionMap.has(room)) {
    sectionMap.set(room, new Y.Map())
  }
}

function updateField(section: string, room: string, key: string, value: string) {
  const roomMap = ySections.get(section)?.get(room)
  if (roomMap instanceof Y.Map) {
    roomMap.set(key, value)
  }
}

const newFields = ref<Record<string, Record<string, { key: string; value: string }>>>({})
</script>