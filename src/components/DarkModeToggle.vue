<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-vue-next'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDarkMode } = useDarkMode()
</script>

<template>
  <Button
    @click="toggleDarkMode"
    variant="ghost"
    size="icon"
    class="relative"
  >
    <Sun class="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <Moon class="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    <span class="sr-only">切换主题</span>
  </Button>
</template>