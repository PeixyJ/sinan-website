<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <div class="rounded-lg border p-6">
      <h2 class="text-2xl font-bold mb-4">标签 - {{ $route.params.id }}</h2>
      <p class="text-muted-foreground">这里是标签的内容</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {useRoute} from 'vue-router'

const route = useRoute()
</script>