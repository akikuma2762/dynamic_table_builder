<template>
  <label style="display:flex;align-items:center;min-height:32px;">
    <input type="checkbox" style="margin-right:6px;" />
    {{ label }}
  </label>
</template>
<script setup lang="ts">
defineProps<{ label?: string }>();
</script>
