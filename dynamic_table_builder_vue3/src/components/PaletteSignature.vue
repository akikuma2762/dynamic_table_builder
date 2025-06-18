<template>
  <div class="signature-box" style="min-height:40px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;">
    <!-- 小尺寸預覽簽名，palette 內可直接簽名，cell 內可點擊放大 -->
    <canvas
      ref="canvas"
      width="200"
      height="60"
      style="border:1px solid #aaa; background:#fff; cursor:pointer;"
      :draggable="false"
      v-on="modalOnClick ? { click: () => (showModal = true) } : {}"
    ></canvas>
    <button type="button" @click="clearSignature" style="margin-top:2px;">清除</button>
    <!-- Modal 只有 modalOnClick 時才顯示 -->
    <div
      v-if="showModal && modalOnClick"
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
          @pointerdown.stop
          @pointermove.stop
          @pointerup.stop
          @dragstart.prevent
          @dragover.prevent
          @drop.prevent
        ></canvas>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button @click="clearModal">清除</button>
          <button @click="saveModal">儲存</button>
          <button @click="showModal = false">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, defineProps, withDefaults } from 'vue'

const props = withDefaults(defineProps<{ modalOnClick?: boolean }>(), {
  modalOnClick: true
})

// Refs to canvases
const canvas = ref<HTMLCanvasElement | null>(null)
const modalCanvas = ref<HTMLCanvasElement | null>(null)

// 2D contexts
let ctx: CanvasRenderingContext2D | null = null
let modalCtx: CanvasRenderingContext2D | null = null

// Drawing state
let drawing = false
let last = { x: 0, y: 0 }

// Modal visibility
const showModal = ref(false)

/* ---------- 簽名繪圖邏輯 ---------- */
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

function move(
  e: MouseEvent | TouchEvent,
  target: HTMLCanvasElement,
  context: CanvasRenderingContext2D | null,
) {
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

/* ---------- 按鈕動作 ---------- */
function clearSignature() {
  ctx?.clearRect(0, 0, 200, 60)
}
function clearModal() {
  modalCtx?.clearRect(0, 0, 400, 160)
}
function saveModal() {
  // 將 modalCanvas 內容縮放複製到小 canvas
  if (canvas.value && modalCanvas.value) {
    ctx?.clearRect(0, 0, 200, 60)
    ctx?.drawImage(modalCanvas.value, 0, 0, 200, 60)
  }
  showModal.value = false
}

/* ---------- 註冊事件 ---------- */
onMounted(() => {
  // 小 canvas
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    ctx!.lineWidth = 2
    ctx!.lineCap = 'round'

    canvas.value.addEventListener('mousedown', (e) => start(e, canvas.value!))
    canvas.value.addEventListener('mousemove', (e) => move(e, canvas.value!, ctx))
    window.addEventListener('mouseup', stop)

    canvas.value.addEventListener('touchstart', (e) => start(e, canvas.value!))
    canvas.value.addEventListener('touchmove', (e) => move(e, canvas.value!, ctx))
    window.addEventListener('touchend', stop)

    // 確保小 canvas 不被拖曳
    canvas.value.addEventListener('dragstart', (e) => e.preventDefault())
  }

  // Modal canvas（需等 DOM 更新完畢）
  nextTick(() => {
    if (modalCanvas.value) {
      modalCtx = modalCanvas.value.getContext('2d')
      modalCtx!.lineWidth = 2
      modalCtx!.lineCap = 'round'

      const m = modalCanvas.value
      m.addEventListener('mousedown', (e) => start(e, m))
      m.addEventListener('mousemove', (e) => move(e, m, modalCtx))
      window.addEventListener('mouseup', stop)

      m.addEventListener('touchstart', (e) => start(e, m))
      m.addEventListener('touchmove', (e) => move(e, m, modalCtx))
      window.addEventListener('touchend', stop)

      // 防止拖曳
      m.addEventListener('dragstart', (e) => e.preventDefault())
    }
  })
})
</script>

<style scoped>
/* 阻止文字選擇／手勢捲動，提升簽名體驗 */
canvas[draggable='false'] {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
</style>
