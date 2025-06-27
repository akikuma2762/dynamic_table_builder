<template>
  <div class="palette-textarea-container">
    <div v-if="label" class="textarea-label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="required-indicator">*</span>
      <span v-if="showCharCount" class="char-count">{{ currentLength }}/{{ maxLength || '∞' }}</span>
    </div>
    <div class="textarea-wrapper" :class="{ 'has-error': hasError, 'is-focused': isFocused }">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        :placeholder="placeholder || '請輸入內容...'"
        :maxlength="maxLength"
        :rows="rows"
        :disabled="disabled"
        :readonly="readonly"
        class="palette-textarea"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      ></textarea>
      <div v-if="resizable" class="resize-handle">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M12 0v12L0 12z" fill="currentColor" opacity="0.3"/>
          <path d="M9 3L3 9M12 6L6 12" stroke="currentColor" stroke-width="1" opacity="0.5"/>
        </svg>
      </div>
    </div>
    <div v-if="errorMessage || helpText" class="textarea-footer">
      <div v-if="errorMessage" class="error-message">
        ⚠️ {{ errorMessage }}
      </div>
      <div v-else-if="helpText" class="help-text">
        💡 {{ helpText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  label?: string
  helpText?: string
  errorMessage?: string
  maxLength?: number
  rows?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  resizable?: boolean
  showCharCount?: boolean
  autoFocus?: boolean
  autoHeight?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '請輸入內容...',
  label: '',
  helpText: '',
  errorMessage: '',
  maxLength: 0,
  rows: 3,
  disabled: false,
  readonly: false,
  required: false,
  resizable: true,
  showCharCount: false,
  autoFocus: false,
  autoHeight: false
})

const emit = defineEmits<Emits>()

const textareaRef = ref<HTMLTextAreaElement>()
const isFocused = ref(false)

const currentLength = computed(() => props.modelValue?.length || 0)
const hasError = computed(() => !!props.errorMessage)

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  const value = target.value
  
  emit('update:modelValue', value)
  emit('input', value)
  
  if (props.autoHeight) {
    adjustHeight()
  }
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  emit('blur', event)
  emit('change', props.modelValue)
}

function handleKeydown(event: KeyboardEvent) {
  // Ctrl+Enter 或 Cmd+Enter 觸發提交
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    emit('change', props.modelValue)
  }
}

function adjustHeight() {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
    }
  })
}

// 公開方法
function focus() {
  textareaRef.value?.focus()
}

function blur() {
  textareaRef.value?.blur()
}

function select() {
  textareaRef.value?.select()
}

defineExpose({
  focus,
  blur,
  select,
  textareaRef
})
</script>

<style scoped>
.palette-textarea-container {
  width: 100%;
  margin-bottom: var(--spacing-sm);
}

.textarea-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  font-size: 0.875rem;
}

.label-text {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required-indicator {
  color: var(--color-danger);
  font-weight: bold;
}

.char-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

.textarea-wrapper {
  position: relative;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  overflow: hidden;
}

.textarea-wrapper:hover {
  border-color: var(--color-primary-light);
}

.textarea-wrapper.is-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.textarea-wrapper.has-error {
  border-color: var(--color-danger);
}

.textarea-wrapper.has-error.is-focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.palette-textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: var(--spacing-sm);
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  background: transparent;
  color: var(--color-text);
  resize: vertical;
  min-height: 48px;
  transition: all 0.2s ease;
}

.palette-textarea:disabled {
  background: var(--color-gray-50);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.palette-textarea:readonly {
  background: var(--color-gray-50);
  cursor: default;
}

.palette-textarea::placeholder {
  color: var(--color-text-muted);
  font-style: italic;
  opacity: 0.7;
}

.palette-textarea:focus::placeholder {
  opacity: 0.5;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nw-resize;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.textarea-wrapper:hover .resize-handle {
  opacity: 1;
}

.textarea-footer {
  margin-top: var(--spacing-xs);
  font-size: 0.75rem;
}

.error-message {
  color: var(--color-danger);
  font-weight: 500;
}

.help-text {
  color: var(--color-text-muted);
  font-style: italic;
}

/* 自動高度調整 */
.palette-textarea[data-auto-height] {
  resize: none;
  overflow: hidden;
}

/* 滾動條樣式 */
.palette-textarea::-webkit-scrollbar {
  width: 8px;
}

.palette-textarea::-webkit-scrollbar-track {
  background: var(--color-gray-100);
  border-radius: var(--border-radius);
}

.palette-textarea::-webkit-scrollbar-thumb {
  background: var(--color-gray-300);
  border-radius: var(--border-radius);
}

.palette-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-400);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .palette-textarea {
    font-size: 16px; /* 防止 iOS Safari 縮放 */
  }
}

/* 高對比度支援 */
@media (prefers-contrast: high) {
  .textarea-wrapper {
    border-width: 3px;
  }
}

/* 減少動畫支援 */
@media (prefers-reduced-motion: reduce) {
  .textarea-wrapper,
  .palette-textarea,
  .resize-handle {
    transition: none;
  }
}
</style>
