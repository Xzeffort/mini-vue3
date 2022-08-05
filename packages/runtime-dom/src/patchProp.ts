import { isOn } from '@vue/shared';
import { patchAttr } from './modules/attrs';
import { patchClass } from './modules/class';
import { patchEvent } from './modules/events';
import { patchStyle } from './modules/style';

// 操作dom属性
export function patchProp(el, key, preValue, nextValue) {
  if (key === 'class') {
    patchClass(el, nextValue);
  } else if (key === 'style') {
    patchStyle(el, preValue, nextValue);
  } else if (isOn(key)) {
    patchEvent(el, key, preValue, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}
