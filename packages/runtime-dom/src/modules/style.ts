export function patchStyle(el, preValue, nextValue) {
  for (const key in nextValue) {
    // 新值直接覆盖
    el.style[key] = nextValue[key];
  }
  if (preValue) {
    // 去除老值
    for (let key in preValue) {
      if (nextValue[key] === null) {
        el.style[key] = null;
      }
    }
  }
}
