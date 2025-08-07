<template>
  <div class=" bg-gray-900 text-gray-100 p-4 sm:p-8">
    <UContainer class="space-y-8 max-w-5xl mx-auto">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 class="text-2xl sm:text-3xl font-semibold">Inspection Form</h1>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <UInput v-model="newRoomName" placeholder="New Room Name" size="sm" class="flex-1 sm:w-48" />
          <UButton icon="i-heroicons-plus" @click="addRoom" color="primary" :disabled="!newRoomName.trim()"
            class="block sm:hidden w-10 justify-center" title="Add Room" />
          <UButton icon="i-heroicons-plus" @click="addRoom" color="primary" :disabled="!newRoomName.trim()"
            class="hidden sm:inline-flex">
            + Add Room
          </UButton>
        </div>
      </div>

      <div class="space-y-6">
        <!-- Inspector Info -->
        <UCard class="bg-gray-800">
          <template #header>
            <h2 class="text-xl font-semibold">Inspector</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UInput :model-value="metadata.get('inspector')?.get('name') ?? ''"
              @update:model-value="val => updateMetadataField('inspector', 'name', val)" placeholder="Name" />
            <UInput :model-value="metadata.get('inspector')?.get('company') ?? ''"
              @update:model-value="val => updateMetadataField('inspector', 'company', val)" placeholder="Company" />
            <UInput :model-value="metadata.get('inspector')?.get('address') ?? ''"
              @update:model-value="val => updateMetadataField('inspector', 'address', val)" placeholder="Address"
              class="md:col-span-2" />
          </div>
        </UCard>

        <!-- Property Info -->
        <UCard class="bg-gray-800">
          <template #header>
            <h2 class="text-xl font-semibold">Property</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UInput :model-value="metadata.get('property')?.get('type') ?? ''"
              @update:model-value="val => updateMetadataField('property', 'type', val)"
              placeholder="Property Type (e.g. Condo)" />
            <UInput :model-value="metadata.get('property')?.get('occupancy') ?? ''"
              @update:model-value="val => updateMetadataField('property', 'occupancy', val)"
              placeholder="Occupancy (e.g. Occupied - Furnished)" />
            <div class="md:col-span-2">
              <UCheckboxGroup :model-value="metadata.get('property')?.get('attendance') ?? []"
                @update:model-value="val => updateMetadataField('property', 'attendance', val)"
                :items="attendanceOptions" legend="Attendance" orientation="horizontal" />
            </div>
          </div>
        </UCard>
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
                <UInput v-model="newSectionNames[roomName]" placeholder="New Section Name" size="sm"
                  class="flex-1 sm:w-48" />

                <UButton icon="i-heroicons-plus" size="sm" @click="addSection(roomName)"
                  :disabled="!newSectionNames[roomName]?.trim()" class="block sm:hidden w-10 justify-center"
                  title="Add Section" />
                <UButton icon="i-heroicons-plus" size="sm" @click="addSection(roomName)"
                  :disabled="!newSectionNames[roomName]?.trim()" class="hidden sm:inline-flex">
                  + Add Section
                </UButton>

                <UButton icon="i-heroicons-trash" color="error" variant="soft" size="sm"
                  @click="confirmRoomDelete(roomName)" class="w-10 justify-center" title="Delete Room" />
              </div>
            </div>
          </template>

          <div v-for="[sectionName, section] in room.entries()" :key="sectionName"
            class="space-y-4 mt-4 overflow-x-auto">
            <UCard class="bg-gray-700 min-w-[300px]">
              <template #header>
                <div class="flex justify-between items-center">
                  <h3 class="text-lg font-semibold">{{ sectionName }}</h3>
                  <UButton icon="i-heroicons-trash" color="error" variant="soft" size="xs"
                    @click="confirmSectionDelete(roomName, sectionName)" class="w-8 justify-center"
                    title="Delete Section" />
                </div>
              </template>

              <div class="space-y-3">
                <div v-for="[fieldKey, value] in (section as Y.Map<any>).entries()" :key="fieldKey"
                  class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <span class="w-full sm:w-32 font-medium">{{ fieldKey }}</span>

                  <div v-if="fieldKey === 'condition'" class="flex-1 w-full">
                    <URadioGroup :modelValue="section.get(fieldKey) ?? ''" :items="conditionOptions"
                      @update:modelValue="val => updateField(roomName, sectionName, fieldKey, val)"
                      orientation="horizontal" color="secondary" :ui="{ base: 'ring-gray-900' }" />
                  </div>

                  <div v-else-if="fieldKey === 'pictures'">
                    <div class="flex gap-4">
                      <!-- File Upload -->
                      <UFileUpload multiple layout="list"
                        :model-value="getPictureModel(roomName, sectionName, fieldKey)" @update:modelValue="(...args) => {
                          setPictureModel(roomName, sectionName, fieldKey, args[0] as File[])
                          updatePictureField(roomName, sectionName, fieldKey, args[0] as File[])
                        }" />

                      <div class="flex flex-wrap gap-2">
                        <div v-for="(info, i) in signedUrlCache.get(`${roomName}:${sectionName}`) || []"
                          :key="info.key ?? i" class="relative w-24 h-24 group">

                          <!-- Image -->
                          <img :src="info.url" :alt="info.fileName" class="w-full h-full object-cover rounded-md" />

                          <!-- Delete Button -->
                          <UButton icon="i-heroicons-x-mark" color="neutral" variant="outline" size="xs"
                            class="absolute top-0 right-0" @click="removeImage(roomName, sectionName, info.key)" />
                        </div>
                      </div>

                    </div>
                  </div>

                  <UInput v-else :modelValue="value"
                    @update:modelValue="val => updateField(roomName, sectionName, fieldKey, val)" size="sm"
                    class="flex-1 w-full" />
                </div>
              </div>
            </UCard>
          </div>
        </UCard>
      </div>
    </UContainer>

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
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as Y from 'yjs'
import type { RadioGroupItem, CheckboxGroupItem } from '@nuxt/ui'
import { deleteFormMedia, getSignedUrls } from '~/api'

definePageMeta({ middleware: ['check-doc-id'] })

const route = useRoute()
const docId = route.query.docId as string

const doc = new Y.Doc()
const config = useRuntimeConfig();
const ws = new WebSocket(`${config.public.wsUrl}/?docId=${docId}`)

ws.binaryType = 'arraybuffer'

const yMetaData = doc.getMap<Y.Map<any>>('metadata')
const metadata = ref<Map<string, Y.Map<any>>>(new Map())
const yRooms = doc.getMap<Y.Map<Y.Map<any>>>('rooms')
const rooms = ref<Map<string, Y.Map<Y.Map<any>>>>(new Map())

const newRoomName = ref('')
const newSectionNames = reactive<Record<string, string>>({})

const conditionOptions = ref<RadioGroupItem[]>(['Good', 'Fair', 'Poor', 'None', 'N/A'])
const attendanceOptions = ref<CheckboxGroupItem[]>([
  'Client',
  'Buyer Agent',
  'Seller',
  'Inspector'
])

const showDeleteRoomModal = ref(false)
const showDeleteSectionModal = ref(false)

const roomToDelete = ref<string | null>(null)
const sectionToDelete = ref<{ room: string; section: string } | null>(null)

const pictureModels = reactive(new Map<string, File[]>())

const signedUrlCache = reactive(new Map<string, { fileName: string; url: string; key: string }[]>([]))
const hasFetchedMedia = ref(false)

const syncRooms = () => {
  rooms.value = new Map(yRooms.entries())
}

const syncMetadata = () => {
  metadata.value = new Map(yMetaData.entries())
}

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

onMounted(() => {
  // Observe rooms
  yRooms.observeDeep(() => {
    syncRooms()

    // If rooms get data for the first time, trigger fetchAllMedia once
    if (!hasFetchedMedia.value && yRooms.size > 0) {
      hasFetchedMedia.value = true
      fetchAllMedia()
    }
  })

  syncRooms()
  yMetaData.observeDeep(syncMetadata)
  syncMetadata()

})

function ensureDefaultFields(room: Y.Map<Y.Map<any>>, sectionName: string) {
  const section = room.get(sectionName)
  if (!section) return

  const defaults = ['condition', 'materials', 'location', 'observations', 'pictures']
  for (const key of defaults) {
    if (!section.has(key)) section.set(key, '');
  }
}

function updateMetadataField(section: string, key: string, value: any) {
  const sectionMap = yMetaData.get(section)
  if (sectionMap instanceof Y.Map) {
    sectionMap.set(key, value)
  }
}

function updateField(room: string, section: string, key: string, value: string) {
  const sectionMap = yRooms.get(room)?.get(section)
  if (sectionMap instanceof Y.Map) {
    sectionMap.set(key, value)
  }
}

async function fetchAllMedia() {
  const uniqueFileMap = new Map<string, {
    fileName: string
    contentType: string
    room: string
    section: string
  }>()

  // Step 1: Gather all unique picture keys from all rooms/sections
  for (const [roomName, roomMap] of yRooms.entries()) {
    for (const [sectionName, sectionMap] of roomMap.entries()) {
      const pictures = sectionMap.get('pictures')

      if (pictures instanceof Y.Array) {
        const keys = new Set(pictures.toArray()) // dedupe here

        for (const value of keys) {
          const parts = value.split('/')
          const fileName = parts[3] || ''
          const contentType = `image/${fileName.split('.').pop() || 'jpeg'}`
          const s3Key = value // full S3 key used for indexing

          uniqueFileMap.set(s3Key, {
            fileName,
            contentType,
            room: roomName,
            section: sectionName,
          })
        }
      }
    }
  }

  const filesInfo = Array.from(uniqueFileMap.values())
  if (filesInfo.length > 0) {
    // Step 2: Make ONE call to get all signed URLs
    const signedUrls = await getSignedUrls(filesInfo, "GET", docId)

    // Step 3: Cache signed URLs grouped by room:section with deduplication
    const cacheMap = new Map<string, Map<string, {
      fileName: string
      url: string
      key: string
    }>>() // Map<room:section, Map<key, fileInfo>>

    for (const signedUrl of signedUrls) {
      const { room, section, ...rest } = signedUrl
      const key = `${room}:${section}`

      if (!cacheMap.has(key)) cacheMap.set(key, new Map())
      cacheMap.get(key)!.set(rest.key, rest)
    }

    for (const [roomSectionKey, filesMap] of cacheMap.entries()) {
      signedUrlCache.set(roomSectionKey, Array.from(filesMap.values()))
    }
  }
}


async function updatePictureField(room: string, section: string, key: string, files: File[]) {

  const fileInfo = files.map(file => ({
    fileName: file.name,
    contentType: file.type,
    room,
    section
  }))

  const signedUrls = await getSignedUrls(fileInfo, "PUT", docId)

  await Promise.all(signedUrls.map(async ({ url, key }: { url: string, key: string }, i: number) => {
    const file = files[i]
    if (file) {
      const put: any = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      })

      if (!put.ok) throw new Error(`Failed to upload ${file.name}`)
      else {

        const sectionMap = yRooms.get(room)?.get(section)
        if (sectionMap instanceof Y.Map) {
          // Get or create the Y.Array
          let yArray = sectionMap.get('pictures')
          if (!(yArray instanceof Y.Array)) {
            yArray = new Y.Array()
            sectionMap.set('pictures', yArray)
          }

          // Append the new file info object to the Y.Array
          yArray.push([key])
        }
      }


    }
  }))

  await getSignedUrls(fileInfo, "GET", docId).then((urls) => {
    urls.forEach((url) => {
      // set uploaded files in image cache
      addToSignedUrlCache(room, section, { fileName: url.fileName, url: url.url, key: url.key })
    })
    // remove image from picture model
    setPictureModel(room, section, "pictures", [])
  })
}

function addToSignedUrlCache(room: string, section: string, entry: {
  fileName: string
  url: string
  key: string
}) {
  const roomSectionKey = `${room}:${section}`
  if (!signedUrlCache.has(roomSectionKey)) {
    signedUrlCache.set(roomSectionKey, [entry])
  } else {
    const current = signedUrlCache.get(roomSectionKey)!
    const filtered = current.filter(e => e.key !== entry.key)
    signedUrlCache.set(roomSectionKey, [...filtered, entry])
  }
}


function addRoom() {
  const name = newRoomName.value.trim()
  if (!name || yRooms.has(name)) return

  // 🧹 Clean any stale cache keys just in case
  for (const key of signedUrlCache.keys()) {
    if (key.startsWith(`${name}:`)) {
      signedUrlCache.delete(key)
    }
  }

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

    // 🧹 Clean any stale cache entry for this room/section combo
    const key = `${roomName}:${section}`
    signedUrlCache.delete(key)

    ensureDefaultFields(roomMap, section)
    newSectionNames[roomName] = ''
  }
}

async function removeSection(roomName: string, sectionName: string) {
  const roomMap = yRooms.get(roomName)
  const sectionMap = roomMap?.get(sectionName)

  // Collect picture S3 keys (if they exist)
  const s3Keys: string[] = []
  const pictures = sectionMap?.get('pictures')
  if (pictures instanceof Y.Array) {
    s3Keys.push(...pictures.toArray())
  }

  // Delete from signed URL cache
  const cacheKey = `${roomName}:${sectionName}`
  signedUrlCache.delete(cacheKey)

  // Remove section from yjs
  if (roomMap?.has(sectionName)) {
    roomMap.delete(sectionName)
  }

  // Delete pictures from S3
  if (s3Keys.length > 0) {
    await deleteFormMedia(s3Keys, docId)
  }
}

async function removeRoom(roomName: string) {
  const roomMap = yRooms.get(roomName)
  const s3Keys: string[] = []

  if (roomMap) {
    for (const [_, sectionMap] of roomMap.entries()) {
      const pictures = sectionMap.get('pictures')
      if (pictures instanceof Y.Array) {
        s3Keys.push(...pictures.toArray())
      }
    }
  }

  // Delete from signedUrlCache all keys for this room
  for (const key of signedUrlCache.keys()) {
    if (key.startsWith(`${roomName}:`)) {
      signedUrlCache.delete(key)
    }
  }

  // Remove room and related newSectionNames entry
  if (yRooms.has(roomName)) {
    yRooms.delete(roomName)
    delete newSectionNames[roomName]
  }

  // Delete all S3 files for this room
  if (s3Keys.length > 0) {
    await deleteFormMedia(s3Keys, docId)
  }
}

async function removeImage(roomName: string, sectionName: string, key: string) {
  const sectionMap = yRooms.get(roomName)?.get(sectionName)
  const pictures = sectionMap?.get('pictures')

  if (pictures instanceof Y.Array) {
    const index = pictures.toArray().findIndex((k: string) => k.includes(key))
    if (index !== -1) pictures.delete(index)
  }

  // Remove from cache
  const cacheKey = `${roomName}:${sectionName}`
  const current = signedUrlCache.get(cacheKey)
  if (current) {
    signedUrlCache.set(
      cacheKey,
      current.filter((item) => item.key !== key)
    )
  }

  await deleteFormMedia([key], docId)
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

function getPictureModel(room: string, section: string, field: string): File[] {
  const key = `${room}:${section}:${field}`
  return pictureModels.get(key) || []
}

function setPictureModel(room: string, section: string, field: string, files: File[]) {
  const key = `${room}:${section}:${field}`
  pictureModels.set(key, files)
}

</script>
