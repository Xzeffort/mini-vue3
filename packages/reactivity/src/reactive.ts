import { isObject } from '@vue/shared';
import {
  mutableHandlers,
  ReactiveFlags,
  readonlyHandlers,
} from './baseHandlers';

// 引入 reactiveMap等 主要是为了是获取已经被代理过的对象，不需要重复代理。
export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();

export function reactive(target: any) {
  return createReactiveObject(target, false, mutableHandlers, reactiveMap);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyMap);
}

function createReactiveObject(target, isReadonly, baseHandlers, proxyMap) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return;
  }
  if (!isReadonly && target[ReactiveFlags.IS_REACTIVE]) {
    // 如果传入响应式对象，则直接返回
    // 如果一个对象是只读的，那么它被添加响应式是无效的，直接返回
    // 如果 readonly() 添加在响应式对象上，则不应该返回
    // target is already a Proxy, return it.
    // exception: calling readonly() on a reactive object
    return target;
  }

  if (proxyMap.has(target)) {
    // 如果对象已经被代理过，则返回代理对象
    return proxyMap.get(target);
  }
  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}

// 判断是否是响应式对象
export function isReactive(value: unknown): boolean {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

// 判断是否是只读对象
export function isReadonly(value: unknown): boolean {
  return !!(value && value[ReactiveFlags.IS_READONLY]);
}

// 如果是对象转成响应式对象
export const toReactive = (value: unknown) =>
  isObject(value) ? reactive(value) : value;

// 如果是对象转成只读对象
export const toReadonly = (value: unknown) =>
  isObject(value) ? readonly(value) : value;

// 判断对象是否被代理
export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value);
}

export function toRaw(value: unknown) {
  const raw = value && value[ReactiveFlags.RAW];
  // 为什么需要再次递归，例如
  // const data = reactive(obj); const x = readonly(data); console.log(toRaw(x) === obj);
  // toRaw(x) 第一次得到的值为 data，再次递归才能得到 obj
  return raw ? toRaw(raw) : value;
}
