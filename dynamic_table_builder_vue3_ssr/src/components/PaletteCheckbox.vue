<template>
  <div class="palette-checkbox" tabindex="0" @keydown.space.prevent="handleKeyboardToggle" @keydown.enter.prevent="handleKeyboardToggle">
    <input 
      type="checkbox" 
      :id="checkboxId"
      v-model="isChecked"
      @change="handleChange"
      class="checkbox-input"
    />
    <label :for="checkboxId" class="checkbox-label">
      <span class="checkbox-text">{{ label || '選項' }}</span>
      <span v-if="description" class="checkbox-description">{{ description }}</span>
    </label>
    <div class="checkbox-status" :class="{ active: isChecked }">
      {{ isChecked ? '✅' : '⬜' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  label?: string
  description?: string
  modelValue?: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '選項',
  description: '',
  modelValue: false,
  disabled: false
})

const emit = defineEmits<Emits>()

const checkboxId = computed(() => `checkbox-${Math.random().toString(36).substr(2, 9)}`)

const isChecked = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    if (!props.disabled) {
      emit('update:modelValue', value)
    }
  }
})

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!props.disabled) {
    emit('change', target.checked)
  }
}

function handleKeyboardToggle() {
  if (!props.disabled) {
    isChecked.value = !isChecked.value
  }
}
</script>

<style scoped>
.palette-checkbox {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  margin-bottom: var(--spacing-xs);
  position: relative;
  overflow: hidden;
}

.palette-checkbox::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.palette-checkbox:hover::before {
  left: 100%;
}

.palette-checkbox:hover {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-surface));
  border-color: var(--color-primary);
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.palette-checkbox:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.palette-checkbox:active {
  transform: translateX(2px) scale(0.98);
}

.checkbox-input {
  width: 20px;
  height: 20px;
  margin-right: var(--spacing-sm);
  cursor: pointer;
  accent-color: var(--color-primary);
  transform: scale(1.2);
  transition: transform 0.2s ease;
}

.checkbox-input:checked {
  transform: scale(1.3);
}

.checkbox-label {
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.checkbox-text {
  font-size: 0.95rem;
  line-height: 1.3;
}

.checkbox-description {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}

.checkbox-status {
  font-size: 1.2rem;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.checkbox-status.active {
  opacity: 1;
  transform: scale(1.2);
}

.palette-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.palette-checkbox:disabled:hover {
  background: var(--color-surface);
  border-color: var(--color-border);
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .palette-checkbox,
  .checkbox-input,
  .checkbox-status {
    transition: none;
  }
  
  .palette-checkbox::before {
    display: none;
  }
}
</style>
