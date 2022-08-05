// https://github.com/vuejs/core/blob/cdda49bbfb/packages/runtime-dom/src/modules/attrs.ts
export function patchAttr(el, key, nextValue) {
  if (nextValue) {
    //  细节问题，还需要判断Boolean Attr
    // https://github.com/vuejs/core/blob/cdda49bbfb/packages/shared/src/domAttrConfig.ts
    el.setAttribute(key, nextValue);
  } else {
    el.removeAttribute(key);
  }
}
