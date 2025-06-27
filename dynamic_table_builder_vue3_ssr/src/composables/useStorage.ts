import { ref, type Ref } from 'vue'

/**
 * SSR-safe localStorage composable
 * 在 SSR 環境下安全地使用 localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T): {
  value: Ref<T>
  setValue: (newValue: T) => void
  removeValue: () => void
  isClient: Ref<boolean>
} {
  const isClient = ref(typeof window !== 'undefined')
  const value = ref(defaultValue) as Ref<T>

  // 初始化值
  if (isClient.value) {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        value.value = JSON.parse(stored)
      }
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error)
      value.value = defaultValue
    }
  }

  const setValue = (newValue: T) => {
    value.value = newValue
    if (isClient.value) {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    }
  }

  const removeValue = () => {
    value.value = defaultValue
    if (isClient.value) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error)
      }
    }
  }

  return {
    value,
    setValue,
    removeValue,
    isClient
  }
}

/**
 * 通用的客戶端檢查函數
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined'
}

/**
 * 安全地獲取 localStorage 項目
 */
export function safeGetLocalStorage(key: string, defaultValue: any = null): any {
  if (!isClientSide()) return defaultValue
  
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn(`Error getting localStorage key "${key}":`, error)
    return defaultValue
  }
}

/**
 * 安全地設置 localStorage 項目
 */
export function safeSetLocalStorage(key: string, value: any): void {
  if (!isClientSide()) return
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error)
  }
}

/**
 * 安全地移除 localStorage 項目
 */
export function safeRemoveLocalStorage(key: string): void {
  if (!isClientSide()) return
  
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn(`Error removing localStorage key "${key}":`, error)
  }
}
