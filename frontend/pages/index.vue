<template>
  <div class="h-[calc(100vh-128px)] flex items-center justify-center px-4">
    <div class="w-full max-w-4xl flex flex-col md:flex-row justify-center items-stretch gap-6">
      
      <!-- Open a Doc -->
      <div
        class="flex-1 p-6 rounded-2xl backdrop-blur bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <div class="flex flex-col items-center space-y-4 text-center">
          <h2 class="text-2xl font-bold text-primary">Open a Doc</h2>
          <p class="text-muted text-sm">Enter the doc code.</p>

          <div class="flex flex-col space-y-3 w-full max-w-xs">
            <UInput v-model="docId" placeholder="Enter doc id" color="primary" />
          </div>
          <UButton :disabled="!docId" color="primary" variant="outline" label="Open Doc" size="lg" class="mt-2"
            @click="openDoc(docId)" />
        </div>
      </div>

      <!-- Create a Doc -->
      <div
        class="flex-1 p-6 rounded-2xl backdrop-blur bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <div class="flex flex-col items-center space-y-4 text-center">
          <h2 class="text-2xl font-bold text-primary">Create New Doc</h2>
          <p class="text-muted text-sm">Start a new inspection report.</p>

          <UButton color="primary" size="lg" class="mt-4" icon="i-heroicons-plus-circle"
            @click="navigateTo('/create')">
            New Doc
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const docId = ref<string>('1')

const openDoc = async (docId: string) => {
  await navigateTo({
    path: '/inspection-form',
    query: {
      docId
    },
  })
}
</script>
