<template>
  <textarea :placeholder="placeholder" style="width:100%;min-height:32px;"></textarea>
</template>
<script setup lang="ts">
defineProps<{ placeholder?: string }>();
</script>
