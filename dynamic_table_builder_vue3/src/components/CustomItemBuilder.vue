<template>
  <fieldset id="itemBuilder" style="margin-bottom: 1rem">
    <legend>自訂檢查項目產生器</legend>
    <label>
      <div>Checkbox 標籤:</div>
      <input v-model="builderChkLabel" type="text" placeholder="OK" style="width: 120px" />
      <button type="button" @click="addCustomCheckbox">➕ 加入 Checkbox</button>
    </label>
    <br /><br />
    <label>
      <div>文字輸入 placeholder:</div>
      <input v-model="builderInputPH" type="text" placeholder="請輸入…" style="width: 160px" />
      <button type="button" @click="addCustomInput">➕ 加入輸入框</button>
    </label>
    <br /><br />
    <div>
      <QuillEditor
        v-model:content="builderHtml"
        contentType="html"
        theme="snow"
        :toolbar="quillToolbar"
        style="height:120px; margin-bottom:8px;"
        @ready="handleQuillReady"
      />
    </div>
    <div id="builderPreview" v-html="builderPreviewHtml" style="border:1px dashed #ccc;padding:0.5rem;min-height:40px;background:#fafafa;margin-top:8px;"></div>
    <br />
    <button type="button" @click="addCustomHtml">新增到調色盤</button>
    <button type="button" @click="clearBuilder">清空輸入</button>
  </fieldset>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
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
  ['link', 'image'],
  ['clean'],
]

// 僅單向同步 Quill 內容到預覽區，避免 watch 造成循環
watch(builderHtml, (val) => {
  builderPreviewHtml.value = val || '(預覽區)'
})

function handleQuillReady(quill: any) {
  builderQuill.value = quill
}
function addCustomCheckbox() {
  const quill = builderQuill.value
  if (!quill || typeof quill.insertEmbed !== 'function') {
    alert('Quill 編輯器尚未初始化，請稍後再試')
    return
  }
  try {
    quill.focus()
    const label = builderChkLabel.value || 'OK'
    const insertIndex = quill.getLength() - 1 // 強制插入到內容最後
    quill.setSelection(insertIndex, 0)
    quill.insertEmbed(insertIndex, 'checkbox', { label }, 'user')
    const newLen = quill.getLength()
    quill.setSelection(Math.min(insertIndex + 1, newLen - 1), 0)
  } catch (e) {
    alert('插入 Checkbox 失敗：' + (e instanceof Error ? e.message : e))
  }
}
function addCustomInput() {
  const quill = builderQuill.value
  if (!quill || typeof quill.insertEmbed !== 'function') {
    alert('Quill 編輯器尚未初始化，請稍後再試')
    return
  }
  try {
    quill.focus()
    const ph = builderInputPH.value || '請輸入…'
    const insertIndex = quill.getLength() - 1 // 強制插入到內容最後
    quill.setSelection(insertIndex, 0)
    quill.insertEmbed(insertIndex, 'textinput', { placeholder: ph, width: '150px' }, 'user')
    const newLen = quill.getLength()
    quill.setSelection(Math.min(insertIndex + 1, newLen - 1), 0)
  } catch (e) {
    alert('插入輸入框失敗：' + (e instanceof Error ? e.message : e))
  }
}
function addCustomHtml() {
  if (!builderPreviewHtml.value || builderPreviewHtml.value === '(預覽區)') {
    alert('尚未設定內容')
    return
  }
  props.onAddCustomHtml(builderPreviewHtml.value)
  clearBuilder()
}
function clearBuilder() {
  builderChkLabel.value = ''
  builderInputPH.value = ''
  builderHtml.value = ''
  builderPreviewHtml.value = '(預覽區)'
  if (builderQuill.value) builderQuill.value.setContents([])
}
</script>
