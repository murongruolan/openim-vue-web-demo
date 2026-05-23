<template>
  <a-layout class="contact-layout relative z-0 flex-row">
    <ContactSider />
    <RouterView />
  </a-layout>
</template>

<script setup lang="ts">
import ContactSider from "./components/ContactSider.vue";
</script>

<style scoped lang="scss">
.contact-layout {
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
</style>
