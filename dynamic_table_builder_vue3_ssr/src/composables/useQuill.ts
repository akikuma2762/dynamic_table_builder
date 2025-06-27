import { ref, onMounted, nextTick } from 'vue'

export function useQuill(editorRef: any, toolbarRef: any) {
  const quillInstance = ref<any>(null)
  const isClient = ref(false)

  onMounted(async () => {
    // 確保在客戶端環境
    isClient.value = typeof window !== 'undefined'
    if (!isClient.value) return

    try {      // 動態載入 Quill 相關模組
      const QuillModule = await import('quill')
      await import('quill/dist/quill.snow.css')
      
      const Quill = QuillModule.default

      // 等待 DOM 更新
      await nextTick()

      if (!editorRef.value || !toolbarRef.value) return

      // 註冊自訂 Blots
      const InlineEmbed = Quill.import('blots/embed')
      
      // @ts-ignore
      class CheckboxBlot extends InlineEmbed {
        static blotName = 'checkbox'
        static tagName = 'span'
        
        static create(value = { label: 'OK' }) {
          const node = super.create();
          node.setAttribute('contenteditable', 'false');
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = value.label || 'OK';
          input.style.margin = '0 4px 0 0';
          const text = document.createTextNode(value.label || 'OK');
          node.appendChild(input);
          node.appendChild(text);
          return node;
        }
        static value(node: HTMLElement) {
          return { label: node.textContent?.trim() || '' };
        }
      }      // @ts-ignore
      Quill.register(CheckboxBlot, true);

      // @ts-ignore
      class TextInputBlot extends InlineEmbed {
        static blotName = 'textinput'
        static tagName = 'span'
        
        static create(value = { placeholder: '請輸入…', width: '100px' }) {
          const node = super.create();
          node.setAttribute('contenteditable', 'false');
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = value.placeholder || '';
          input.style.width = value.width || '100px';
          node.appendChild(input);
          return node;
        }
        static value(node: HTMLElement) {
          const inp = node.querySelector('input');
          return {
            placeholder: inp?.placeholder || '',
            width: inp?.style.width || '',
          };
        }
      }
      // @ts-ignore
      Quill.register(TextInputBlot, true);

      // 初始化 Quill
      quillInstance.value = new Quill(editorRef.value, {
        theme: 'snow',
        placeholder: '請輸入文字或使用右側按鈕插入元件…',
        modules: { 
          toolbar: toolbarRef.value
        },
      })

      return quillInstance.value
    } catch (error) {
      console.warn('Failed to load Quill:', error)
    }
  })

  return {
    quillInstance,
    isClient
  }
}
