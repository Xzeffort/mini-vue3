import { track, trigger } from './effect';
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
    return Reflect.get(target, key, receiver);
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
