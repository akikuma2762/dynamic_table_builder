import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Quill from 'quill'
import { QuillEditor } from '@vueup/vue-quill'

// ===== Quill 自訂 Blot 註冊（checkbox 與 inputbox） =====
const Inline = Quill.import('blots/inline')
class CheckboxBlot extends Inline {
  static create(value = { label: 'OK' }) {
    const node = super.create();
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = value.label || 'OK';
    input.style.margin = '0 4px 0 0';
    input.title = value.label || 'OK';
    // 不設 readonly，允許游標進入
    node.appendChild(input);
    return node;
  }
  static value(node: HTMLElement): { label: string } {
    const input = node.querySelector('input') as HTMLInputElement | null;
    return { label: input?.value || '' };
  }
}
CheckboxBlot.blotName = 'checkbox';
CheckboxBlot.tagName = 'span';
Quill.register(CheckboxBlot, true);

class TextInputBlot extends Inline {
  static create(value = { placeholder: '請輸入…', width: '150px' }) {
    const node = super.create();
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = value.placeholder || '';
    input.style.width = value.width || '150px';
    node.appendChild(input);
    return node;
  }
  static value(node: HTMLElement): { placeholder: string; width: string } {
    const inp = node.querySelector('input') as HTMLInputElement | null;
    return {
      placeholder: inp?.placeholder || '',
      width: inp?.style.width || '',
    };
  }
}
TextInputBlot.blotName = 'textinput';
TextInputBlot.tagName = 'span';
Quill.register(TextInputBlot, true);

// @ts-ignore
QuillEditor.Quill = Quill
createApp(App).use(router).mount('#app')
