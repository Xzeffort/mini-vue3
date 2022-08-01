import { isObject } from '@vue/shared';
import { mutableHandlers, ReactiveFlags } from './baseHandler';

// 引入 reactiveMap 主要是为了是获取已经被代理过的对象，不需要重复代理。
const reactiveMap = new WeakMap();

export function reactive(target: any) {
  if (!isObject(target)) {
    return;
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    // 如果传入代理对象，则直接返回
    return target;
  }

  if (reactiveMap.has(target)) {
    // 如果对象已经被代理过，则返回代理对象
    return reactiveMap.get(target);
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// 判断是否是响应式对象
export function isReactive(obj) {
  return !!(obj && obj[ReactiveFlags.IS_REACTIVE]);
}

// 如果是对象转成响应式对象
export const toReactive = (value) =>
  isObject(value) ? reactive(value) : value;
