<template>
  <div class=" bg-gray-900 text-white py-6 px-4">
    <UContainer class="space-y-6 max-w-3xl mx-auto">
      <h1 class="text-3xl font-bold text-center">Create New Inspection Report</h1>

      <!-- Inspector Info -->
      <UCard class="bg-gray-800">
        <template #header>
          <h2 class="text-xl font-semibold">Inspector Info</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UInput v-model="inspector.name" placeholder="Name" />
          <UInput v-model="inspector.company" placeholder="Company" />
          <UInput v-model="inspector.address" placeholder="Address" class="md:col-span-2" />
        </div>
      </UCard>

      <!-- Property Info -->
      <UCard class="bg-gray-800">
        <template #header>
          <h2 class="text-xl font-semibold">Property Info</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UInput v-model="property.type" placeholder="Property Type (e.g. Condo)" />
          <UInput v-model="property.occupancy" placeholder="Occupancy (e.g. Occupied - Furnished)" />
          <div class="md:col-span-2">
            <UCheckboxGroup v-model="property.attendance" :items="attendanceOptions" legend="Attendance"
              orientation="horizontal" />
          </div>
        </div>
      </UCard>

      <!-- Create Button -->
      <div class="text-center">
        <UButton @click="createReport" color="primary" size="lg" :disabled="!formValid">
          Create Report
        </UButton>
      </div>
    </UContainer>
  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import * as Y from 'yjs'
import type { Inspector, Property, MetaData } from '~/domain'
import type { CheckboxGroupItem } from '@nuxt/ui'
import { saveDoc } from '~/api'

// Form state
const inspector = ref<Inspector>({
  name: '',
  company: '',
  address: ''
})

const property = ref<Property>({
  type: '',
  occupancy: '',
  attendance: []
})

const attendanceOptions = ref<CheckboxGroupItem[]>([
  'Client',
  'Buyer Agent',
  'Seller',
  'Inspector'
])

const formValid = computed(() => {
  return inspector.value.name.trim() !== '' && property.value.type.trim() !== ''
})

const router = useRouter()

async function createReport() {
  const docId = uuidv4()

  // Create new Y.Doc
  const doc = new Y.Doc()

  // Get or create the top-level metadata map
  const metaMap = doc.getMap('metadata')

    // Create nested Y.Maps
  const inspectorMap = new Y.Map(Object.entries(inspector.value))

  const propertyMap = new Y.Map([
    ['type', property.value.type],
    ['occupancy', property.value.occupancy],
    ['attendance', Y.Array.from(property.value.attendance ?? [])]
  ])

  // Set nested maps in metadata
  metaMap.set('inspector', inspectorMap)
  metaMap.set('property', propertyMap)

  // Optionally initialize a first room
  const roomId = uuidv4()

  const roomsMap = doc.getMap<Y.Map<any>>('roomdata')

  const initialRoomMap = new Y.Map<any>()

  initialRoomMap.set('name', new Y.Text('Kitchen'))
  initialRoomMap.set('sections', new Y.Map<Y.Map<any>>())

  roomsMap.set(roomId, initialRoomMap)

  await saveDoc(docId, doc)

  // Navigate to the inspection form editor with docId
  router.push({ path: '/inspection-form', query: { docId } })
}
</script>
