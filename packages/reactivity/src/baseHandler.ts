import { isObject } from '@vue/shared';
import { track, trigger } from './effect';
import { reactive } from './reactive';
export const enum ReactiveFlags {
  // 是否已经被代理过的唯一标识，主要解决当参数为代理对象proxy，直接返回该代理对象
  IS_REACTIVE = '__v_isReactive',
}

export const mutableHandlers = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, 'get', key);
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      // 深度代理，只有取到该值的时候才会执行，所以相比较于vue2性能更好
      res = reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, 'set', key, value, oldValue);
    }
    return result;
  },
};
