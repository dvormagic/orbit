<script setup lang="ts">
import OrbitWidget from './components/OrbitWidget.vue'
</script>

<template>
  <div class="w-screen p-2 overflow-visible">
    <OrbitWidget />
  </div>
</template>

<style>
/* Global resets for transparent window */
html, body {
  background: transparent !important;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
