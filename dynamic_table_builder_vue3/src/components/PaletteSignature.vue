<template>
  <div class="signature-box" style="min-height:40px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;">
    <template v-if="!showModal">
      <img
        v-if="props.imageData"
        :src="props.imageData"
        alt="簽名"
        style="border:1px solid #aaa; background:#fff; width:200px; height:60px; object-fit:contain; cursor:pointer;"
        @click="openModal"
      />
      <div v-else style="width:100%;height:60px;border:1px solid #aaa;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;" @click="openModal">
        <span style="color:#bbb;">點擊簽名</span>
      </div>
    </template>
    <template v-else>
      <div
        class="sig-modal"
        style="position:fixed;z-index:9999;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;pointer-events:auto;"
        @dragstart.prevent
        @dragover.prevent
        @drop.prevent
        @pointerdown.stop
        @pointermove.stop
        @pointerup.stop
      >
        <div style="background:#fff;padding:16px;border-radius:8px;box-shadow:0 2px 8px #0003;display:flex;flex-direction:column;align-items:center;">
          <canvas
            ref="modalCanvas"
            width="400"
            height="160"
            style="border:1px solid #aaa; background:#fff; cursor:crosshair;"
            draggable="false"
          ></canvas>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <button @click="clearModal">清除</button>
            <button @click="saveModal">儲存</button>
            <button @click="closeModal">關閉</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, defineProps, withDefaults, watch, defineEmits } from 'vue'

const props = withDefaults(defineProps<{ modalOnClick?: boolean; imageData?: string }>(), {
  modalOnClick: true,
  imageData: ''
})
const emit = defineEmits(['update:imageData'])

const modalCanvas = ref<HTMLCanvasElement | null>(null)
let modalCtx: CanvasRenderingContext2D | null = null
let drawing = false
let last = { x: 0, y: 0 }
const showModal = ref(false)

function openModal() {
  showModal.value = true
}
function closeModal() {
  showModal.value = false
}

function getPos(e: MouseEvent | TouchEvent, target: HTMLCanvasElement) {
  const rect = target.getBoundingClientRect()
  if ('touches' in e) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    }
  }
  return {
    x: (e as MouseEvent).clientX - rect.left,
    y: (e as MouseEvent).clientY - rect.top,
  }
}
function start(e: MouseEvent | TouchEvent, target: HTMLCanvasElement) {
  drawing = true
  last = getPos(e, target)
}
function move(e: MouseEvent | TouchEvent, target: HTMLCanvasElement, context: CanvasRenderingContext2D | null) {
  if (!drawing) return
  const pos = getPos(e, target)
  context!.beginPath()
  context!.moveTo(last.x, last.y)
  context!.lineTo(pos.x, pos.y)
  context!.stroke()
  last = pos
  e.preventDefault()
}
function stop() {
  drawing = false
}
function clearModal() {
  modalCtx?.clearRect(0, 0, 400, 160)
}
function saveModal() {
  if (modalCanvas.value) {
    const data = modalCanvas.value.toDataURL('image/png')
    emit('update:imageData', data)
  }
  closeModal()
}

// 事件 handler 變數
let mousedownHandler: ((e: MouseEvent) => void) | null = null
let mousemoveHandler: ((e: MouseEvent) => void) | null = null
let touchstartHandler: ((e: TouchEvent) => void) | null = null
let touchmoveHandler: ((e: TouchEvent) => void) | null = null
let dragstartHandler: ((e: DragEvent) => void) | null = null
let windowMouseupHandler: (() => void) | null = null
let windowTouchendHandler: (() => void) | null = null

watch(showModal, (val) => {
  if (val) {
    nextTick(() => {
      if (modalCanvas.value) {
        modalCtx = modalCanvas.value.getContext('2d')
        modalCtx!.lineWidth = 2
        modalCtx!.lineCap = 'round'
        const m = modalCanvas.value
        // 先移除舊事件
        if (mousedownHandler) m.removeEventListener('mousedown', mousedownHandler)
        if (mousemoveHandler) m.removeEventListener('mousemove', mousemoveHandler)
        if (touchstartHandler) m.removeEventListener('touchstart', touchstartHandler)
        if (touchmoveHandler) m.removeEventListener('touchmove', touchmoveHandler)
        if (dragstartHandler) m.removeEventListener('dragstart', dragstartHandler)
        if (windowMouseupHandler) window.removeEventListener('mouseup', windowMouseupHandler)
        if (windowTouchendHandler) window.removeEventListener('touchend', windowTouchendHandler)
        // 新增事件
        mousedownHandler = (e: MouseEvent) => start(e, m)
        mousemoveHandler = (e: MouseEvent) => move(e, m, modalCtx)
        touchstartHandler = (e: TouchEvent) => start(e, m)
        touchmoveHandler = (e: TouchEvent) => move(e, m, modalCtx)
        dragstartHandler = (e: DragEvent) => e.preventDefault()
        windowMouseupHandler = () => stop()
        windowTouchendHandler = () => stop()
        m.addEventListener('mousedown', mousedownHandler)
        m.addEventListener('mousemove', mousemoveHandler)
        m.addEventListener('touchstart', touchstartHandler)
        m.addEventListener('touchmove', touchmoveHandler)
        m.addEventListener('dragstart', dragstartHandler)
        window.addEventListener('mouseup', windowMouseupHandler)
        window.addEventListener('touchend', windowTouchendHandler)
        // 載入 imageData
        if (props.imageData) {
          const img = new window.Image()
          img.onload = () => {
            modalCtx?.clearRect(0, 0, 400, 160)
            modalCtx?.drawImage(img, 0, 0, 400, 160)
          }
          img.src = props.imageData
        } else {
          modalCtx?.clearRect(0, 0, 400, 160)
        }
      }
    })
  } else if (modalCanvas.value) {
    const m = modalCanvas.value
    // 關閉時移除事件
    if (mousedownHandler) m.removeEventListener('mousedown', mousedownHandler)
    if (mousemoveHandler) m.removeEventListener('mousemove', mousemoveHandler)
    if (touchstartHandler) m.removeEventListener('touchstart', touchstartHandler)
    if (touchmoveHandler) m.removeEventListener('touchmove', touchmoveHandler)
    if (dragstartHandler) m.removeEventListener('dragstart', dragstartHandler)
    if (windowMouseupHandler) window.removeEventListener('mouseup', windowMouseupHandler)
    if (windowTouchendHandler) window.removeEventListener('touchend', windowTouchendHandler)
  }
})
</script>

<style scoped>
canvas[draggable='false'] {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
</style>
