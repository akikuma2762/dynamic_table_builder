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
      v-show="showModal && modalOnClick"
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
import { ref, onMounted, nextTick, defineProps, withDefaults, watch, defineEmits } from 'vue'

const props = withDefaults(defineProps<{ modalOnClick?: boolean; imageData?: string }>(), {
  modalOnClick: true,
  imageData: ''
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

// 定義 emit
const emit = defineEmits(['update:imageData'])

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
    // 將 imageData emit 給父層
    const data = canvas.value.toDataURL('image/png')
    emit('update:imageData', data)
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
    //console.log('[PaletteSignature] nextTick modalCanvas', modalCanvas.value)
    if (modalCanvas.value) {
      modalCtx = modalCanvas.value.getContext('2d')
      modalCtx!.lineWidth = 2
      modalCtx!.lineCap = 'round'

      const m = modalCanvas.value
      m.addEventListener('mousedown', (e) => { //console.log('[PaletteSignature] modal mousedown');
       start(e, m) })
      m.addEventListener('mousemove', (e) => move(e, m, modalCtx))
      window.addEventListener('mouseup', stop)

      m.addEventListener('touchstart', (e) => { //console.log('[PaletteSignature] modal touchstart');
       start(e, m) })
      m.addEventListener('touchmove', (e) => move(e, m, modalCtx))
      window.addEventListener('touchend', stop)

      // 防止拖曳
      m.addEventListener('dragstart', (e) => e.preventDefault())
    }
  })
})

watch(() => props.imageData, (val) => {
    //console.log('Signature imageData updated:', val)
  if (val && canvas.value && ctx) {
    const img = new window.Image()
    img.onload = () => {
      ctx!.clearRect(0, 0, 200, 60)
      ctx!.drawImage(img, 0, 0, 200, 60)
    }
    img.src = val
  }
  if (val && modalCanvas.value && modalCtx) {
    const img = new window.Image()
    img.onload = () => {
      modalCtx!.clearRect(0, 0, 400, 160)
      modalCtx!.drawImage(img, 0, 0, 400, 160)
    }
    img.src = val
  }
})

// Modal 開啟時自動將小 canvas 複製到 modal canvas
watch(showModal, (val) => {
  //console.log('[PaletteSignature] showModal changed:', val, canvas.value, modalCanvas.value)
  if (val && canvas.value) {
    const tryCopy = (retry = 0) => {
      nextTick(() => {
        if (modalCanvas.value) {
          //console.log('[PaletteSignature] modalCanvas ready, copying image')
          const img = new window.Image()
          img.onload = () => {
            modalCtx?.clearRect(0, 0, 400, 160)
            modalCtx?.drawImage(img, 0, 0, 400, 160)
          }
          img.src = canvas.value!.toDataURL('image/png')
        } else if (retry < 10) {
          //console.log('[PaletteSignature] modalCanvas still null, retry', retry)
          setTimeout(() => tryCopy(retry + 1), 30)
        } else {
          console.warn('[PaletteSignature] modalCanvas still null after retries')
        }
      })
    }
    tryCopy()
  }
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
