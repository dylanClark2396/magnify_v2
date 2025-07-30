<template>
  <div class="h-[calc(100vh-64px)] flex items-center justify-center px-4">
    <div class="w-full max-w-2xl flex flex-col md:flex-row justify-center items-stretch gap-6">
      <div
        class="flex-1 p-6 rounded-2xl backdrop-blur bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <div class="flex flex-col items-center space-y-4 text-center">
          <h2 class="text-2xl font-bold text-primary">Open a Doc</h2>
          <p class="text-muted text-sm">Enter the doc code.</p>

          <div class="flex flex-col space-y-3 w-full max-w-xs">
            <UInput v-model="docId" placeholder="Enter doc id" color="primary" />
          </div>
          <UButton :disabled="!docId" color="primary" variant="outline" label="open doc" size="lg" class="mt-2"
            @click="openDoc(docId)" />
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