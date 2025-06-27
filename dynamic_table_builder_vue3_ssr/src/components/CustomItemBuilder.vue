<template>
  <fieldset id="itemBuilder" class="custom-item-builder">
    <legend>🎨 自訂檢查項目產生器</legend>
    
    <div class="builder-section">
      <div class="builder-input-group">
        <label>
          <div class="input-label">
            <span class="label-icon">☑️</span>
            <span>Checkbox 標籤</span>
          </div>
          <input 
            v-model="builderChkLabel" 
            type="text" 
            placeholder="例如：已完成、確認無誤..." 
            maxlength="20"
            class="builder-input"
          />
        </label>
        <button 
          type="button" 
          @click="addCustomCheckbox" 
          class="add-button checkbox-btn"
          :disabled="!builderChkLabel.trim()"
        >
          ➕ 加入 Checkbox
        </button>
      </div>

      <div class="builder-input-group">
        <label>
          <div class="input-label">
            <span class="label-icon">📝</span>
            <span>文字輸入提示</span>
          </div>
          <input 
            v-model="builderInputPH" 
            type="text" 
            placeholder="例如：請輸入姓名、填寫說明..." 
            maxlength="30"
            class="builder-input"
          />
        </label>
        <button 
          type="button" 
          @click="addCustomInput" 
          class="add-button input-btn"
          :disabled="!builderInputPH.trim()"
        >
          ➕ 加入輸入框
        </button>
      </div>
    </div>

    <div class="editor-section">
      <div class="editor-header">
        <h4>🖋️ 富文本編輯器</h4>
        <div class="editor-info">
          <small>支援格式化文字、圖片、連結等豐富內容</small>
        </div>
      </div>
      <div class="quill-container">
        <QuillEditor
          v-model:content="builderHtml"
          contentType="html"
          theme="snow"
          :toolbar="quillToolbar"
          :options="quillOptions"
          @ready="handleQuillReady"
          @textChange="handleTextChange"
          class="quill-editor"
        />
      </div>
    </div>

    <div class="preview-section">
      <div class="preview-header">
        <h4>👀 即時預覽</h4>
        <div class="preview-actions">
          <button type="button" @click="refreshPreview" class="refresh-btn">
            🔄 重新整理
          </button>
        </div>
      </div>
      <div 
        id="builderPreview" 
        class="builder-preview" 
        v-html="builderPreviewHtml"
        :class="{ empty: !builderPreviewHtml || builderPreviewHtml === '(預覽區)' }"
      ></div>
    </div>

    <div class="action-section">
      <div class="builder-actions">
        <button 
          type="button" 
          @click="addCustomHtml" 
          class="primary-action"
          :disabled="!hasContent"
        >
          ✨ 新增到調色盤
        </button>
        <button 
          type="button" 
          @click="clearBuilder" 
          class="secondary-action"
        >
          🗑️ 清空內容
        </button>
        <button 
          type="button" 
          @click="saveTemplate" 
          class="tertiary-action"
          :disabled="!hasContent"
        >
          💾 儲存範本
        </button>
      </div>
      <div class="action-hints">
        <small>
          💡 <strong>提示：</strong>
          建立的內容將新增至右側調色盤，可拖拽至表格中使用
        </small>
      </div>
    </div>
  </fieldset>
</template>
<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import { safeGetLocalStorage, safeSetLocalStorage, isClientSide } from '../composables/useStorage'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  onAddCustomHtml: (html: string) => void
}>()

const builderChkLabel = ref('')
const builderInputPH = ref('')
const builderHtml = ref('')
const builderPreviewHtml = ref('(預覽區)')
const builderQuill = ref<any>(null)

const quillToolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
]

const quillOptions = {
  theme: 'snow',
  placeholder: '在此輸入富文本內容...',
  modules: {
    toolbar: quillToolbar
  }
}

const hasContent = computed(() => {
  return builderHtml.value && 
         builderHtml.value !== '<p><br></p>' && 
         builderHtml.value.trim() !== ''
})

// 僅單向同步 Quill 內容到預覽區，避免 watch 造成循環
watch(builderHtml, (val) => {
  updatePreview(val)
}, { immediate: true })

function updatePreview(content: string) {
  if (!content || content === '<p><br></p>') {
    builderPreviewHtml.value = '(預覽區)'
    return
  }
  
  // 清理並格式化內容
  let cleanContent = content
    .replace(/<p><br><\/p>/g, '') // 移除空段落
    .replace(/^\s+|\s+$/g, '') // 移除前後空白
  
  builderPreviewHtml.value = cleanContent || '(預覽區)'
}

function handleQuillReady(quill: any) {
  builderQuill.value = quill
  
  // 設定編輯器樣式
  const editor = quill.root
  editor.style.minHeight = '120px'
  editor.style.maxHeight = '300px'
  editor.style.fontSize = '14px'
  editor.style.lineHeight = '1.5'
}

function handleTextChange() {
  // 即時更新預覽
  nextTick(() => {
    updatePreview(builderHtml.value)
  })
}

function addCustomCheckbox() {
  const quill = builderQuill.value
  if (!quill || typeof quill.insertEmbed !== 'function') {
    showNotification('編輯器尚未初始化，請稍後再試', 'warning')
    return
  }
  
  if (!builderChkLabel.value.trim()) {
    showNotification('請輸入 Checkbox 標籤', 'error')
    return
  }
  
  try {
    quill.focus()
    const label = builderChkLabel.value.trim()
    const insertIndex = quill.getLength() - 1
    quill.setSelection(insertIndex, 0)
    quill.insertEmbed(insertIndex, 'checkbox', { label }, 'user')
    const newLen = quill.getLength()
    quill.setSelection(Math.min(insertIndex + 1, newLen - 1), 0)
    
    // 清空輸入框
    builderChkLabel.value = ''
    showNotification('Checkbox 已新增', 'success')
  } catch (e) {
    console.error('插入 Checkbox 失敗：', e)
    showNotification('插入 Checkbox 失敗', 'error')
  }
}

function addCustomInput() {
  const quill = builderQuill.value
  if (!quill || typeof quill.insertEmbed !== 'function') {
    showNotification('編輯器尚未初始化，請稍後再試', 'warning')
    return
  }
  
  if (!builderInputPH.value.trim()) {
    showNotification('請輸入文字輸入提示', 'error')
    return
  }
  
  try {
    quill.focus()
    const ph = builderInputPH.value.trim()
    const insertIndex = quill.getLength() - 1
    quill.setSelection(insertIndex, 0)
    quill.insertEmbed(insertIndex, 'textinput', { placeholder: ph, width: '100%' }, 'user')
    const newLen = quill.getLength()
    quill.setSelection(Math.min(insertIndex + 1, newLen - 1), 0)
    
    // 清空輸入框
    builderInputPH.value = ''
    showNotification('輸入框已新增', 'success')
  } catch (e) {
    console.error('插入輸入框失敗：', e)
    showNotification('插入輸入框失敗', 'error')
  }
}

function addCustomHtml() {
  if (!hasContent.value) {
    showNotification('請先建立一些內容', 'warning')
    return
  }
  
  try {
    props.onAddCustomHtml(builderPreviewHtml.value)
    showNotification('內容已新增到調色盤', 'success')
  } catch (e) {
    console.error('新增到調色盤失敗：', e)
    showNotification('新增到調色盤失敗', 'error')
  }
}

function clearBuilder() {
  builderChkLabel.value = ''
  builderInputPH.value = ''
  builderHtml.value = ''
  builderPreviewHtml.value = '(預覽區)'
  
  if (builderQuill.value) {
    builderQuill.value.setText('')
  }
  
  showNotification('內容已清空', 'info')
}

function saveTemplate() {
  if (!hasContent.value) {
    showNotification('沒有內容可儲存', 'warning')
    return
  }
  
  if (!isClientSide()) {
    showNotification('需要在客戶端環境才能儲存範本', 'warning')
    return
  }
  
  const templateName = prompt('請輸入範本名稱：')
  if (!templateName) return
  
  try {
    const templates = safeGetLocalStorage('customItemTemplates', {})
    templates[templateName] = {
      html: builderHtml.value,
      preview: builderPreviewHtml.value,
      createdAt: new Date().toISOString()
    }
    safeSetLocalStorage('customItemTemplates', templates)
    showNotification(`範本 "${templateName}" 已儲存`, 'success')
  } catch (e) {
    console.error('儲存範本失敗：', e)
    showNotification('儲存範本失敗', 'error')
  }
}

function refreshPreview() {
  updatePreview(builderHtml.value)
  showNotification('預覽已重新整理', 'info')
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  // 簡單的通知實現，可以後續替換為更完整的通知系統
  const emoji = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  console.log(`${emoji[type]} ${message}`)
  
  // 創建臨時通知元素
  const notification = document.createElement('div')
  notification.textContent = `${emoji[type]} ${message}`
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--color-surface);
    border: 2px solid var(--color-primary);
    border-radius: var(--border-radius);
    padding: var(--spacing-sm) var(--spacing-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
  `
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in'
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)  }, 3000)
}
</script>

<style scoped>
.custom-item-builder {
  background: linear-gradient(135deg, var(--color-surface) 0%, #f8fafc 100%);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.custom-item-builder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-primary));
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

.custom-item-builder legend {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 1rem;
  box-shadow: var(--shadow-sm);
  border: none;
}

.builder-section {
  margin-bottom: var(--spacing-lg);
}

.builder-input-group {
  display: flex;
  align-items: end;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border-light);
  transition: all 0.2s ease;
}

.builder-input-group:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-sm);
}

.builder-input-group label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.label-icon {
  font-size: 1rem;
}

.builder-input {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: var(--color-surface);
  min-width: 200px;
}

.builder-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.add-button {
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  height: fit-content;
}

.add-button:hover:not(:disabled) {
  background: var(--color-success-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.add-button:disabled {
  background: var(--color-gray-300);
  cursor: not-allowed;
  transform: none;
}

.checkbox-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.input-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.editor-section {
  margin-bottom: var(--spacing-lg);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.editor-header h4 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.editor-info small {
  color: var(--color-text-muted);
  font-style: italic;
}

.quill-container {
  background: var(--color-surface);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.quill-editor {
  min-height: 150px;
}

/* Quill 編輯器樣式覆蓋 */
:deep(.ql-toolbar) {
  border-bottom: 1px solid var(--color-border) !important;
  background: var(--color-gray-50);
}

:deep(.ql-container) {
  border: none !important;
  font-size: 0.875rem;
}

:deep(.ql-editor) {
  min-height: 120px;
  padding: var(--spacing-md);
  line-height: 1.6;
}

:deep(.ql-editor.ql-blank::before) {
  color: var(--color-text-muted);
  font-style: italic;
}

.preview-section {
  margin-bottom: var(--spacing-lg);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.preview-header h4 {
  margin: 0;
  color: var(--color-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.refresh-btn {
  background: var(--color-gray-500);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  background: var(--color-gray-600);
}

.builder-preview {
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  min-height: 80px;
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
  position: relative;
  transition: all 0.2s ease;
  overflow: auto;
}

.builder-preview.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-style: italic;
  background: repeating-linear-gradient(
    45deg,
    #fafafa,
    #fafafa 10px,
    #f0f0f0 10px,
    #f0f0f0 20px
  );
}

.builder-preview:not(.empty) {
  background: white;
  border-style: solid;
  border-color: var(--color-success-light);
}

.action-section {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}

.builder-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.primary-action {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.primary-action:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.primary-action:disabled {
  background: var(--color-gray-300);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.secondary-action {
  background: var(--color-gray-500);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-action:hover {
  background: var(--color-gray-600);
  transform: translateY(-1px);
}

.tertiary-action {
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tertiary-action:hover:not(:disabled) {
  background: var(--color-accent-dark);
  transform: translateY(-1px);
}

.tertiary-action:disabled {
  background: var(--color-gray-300);
  cursor: not-allowed;
  transform: none;
}

.action-hints small {
  color: var(--color-text-muted);
  font-style: italic;
  display: block;
  line-height: 1.4;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .builder-input-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .builder-input {
    min-width: auto;
  }
  
  .add-button {
    align-self: center;
    width: fit-content;
  }
  
  .builder-actions {
    flex-direction: column;
  }
  
  .preview-header,
  .editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-xs);
  }
}

/* 動畫效果 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-item-builder {
  animation: slideInUp 0.5s ease-out;
}

/* 通知動畫 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* 高對比度支援 */
@media (prefers-contrast: high) {
  .custom-item-builder {
    border-width: 3px;
  }
  
  .builder-input-group {
    border-width: 2px;
  }
}

/* 減少動畫支援 */
@media (prefers-reduced-motion: reduce) {
  .custom-item-builder,
  .add-button,
  .primary-action,
  .secondary-action,
  .tertiary-action,
  .builder-preview {
    transition: none;
    animation: none;
  }
  
  .custom-item-builder::before {
    animation: none;
  }
}
</style>
