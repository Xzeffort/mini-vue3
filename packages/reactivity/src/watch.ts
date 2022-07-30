import { isFunction } from '@vue/shared';
import { isObject } from '@vue/shared';
import { ReactiveEffect } from './effect';
import { isReactive } from './reactive';

export function watch(source, cb) {
  let getter = null;
  let oldValue = undefined;
  if (isReactive(source)) {
    // 如果是响应式对象，默认深度监听
    getter = () => traverse(source);
  } else if (isFunction) {
    getter = source;
  }

  // 引入cleanup 用于清理回调将在下一次重新运行效果之前调用，并可用于清理无效的副作用
  let cleanup = null;
  const onCleanup = (cleanupFn) => {
    cleanup = cleanupFn;
  };

  const job = () => {
    if (cleanup) {
      cleanup();
    }
    const newValue = getter();
    cb(newValue, oldValue, onCleanup);
    // 改变老值
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(getter, job);
  // 获取老值
  oldValue = effect.run();

  // TODO watch方法实质是有返回值的，可以取消监听，内部实现来自effect的stop方法。
}

// 递归对象，监听所有值，其实就是深度监听，相当于设置了deep
function traverse(obj, set = new Set()) {
  if (!isObject(obj)) return obj;
  if (set.has(obj)) return obj;
  set.add(obj);
  for (const key in obj) {
    traverse(obj[key], set);
  }
  return obj;
}
