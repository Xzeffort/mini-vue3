import { isObject } from '@vue/shared';
import { track, trigger } from './effect';
import { reactive, readonly, reactiveMap, readonlyMap } from './reactive';
export const enum ReactiveFlags {
  // 是否已经被代理过的唯一标识，主要解决当参数为代理对象proxy，直接返回该代理对象
  IS_REACTIVE = '__v_isReactive',
  // 是否是只读的对象的标识
  IS_READONLY = '__v_isReadonly',
  // 获取原始对象的标识
  RAW = '__v_raw',
}

const get = createGetter();
const readonlyGet = createGetter(true);

const set = createSetter();

function createGetter(isReadonly = false) {
  return function (target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (
      // TODO 后期如果增加别的 map 这里需要进行相应的修改
      // 这里进行判断 是为了 如果对象被代理过，那么可以直接能拿到原对象
      key === ReactiveFlags.RAW &&
      receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)
    ) {
      return target;
    }

    let res = Reflect.get(target, key, receiver);
    // readonly 无法修改值 自然也没必要收集依赖
    if (!isReadonly) {
      track(target, 'get', key);
    }

    if (isObject(res)) {
      // 深度代理，只有取到该值的时候才会执行，所以相比较于vue2性能更好
      res = isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

/**
 * 
 * https://zhuanlan.zhihu.com/p/87899787
 * const child = { name: 'child' };
const parent = new Proxy(
  { name: 'parent', foo: '1111' },
  {
    set(target, key, value, receiver) {
      console.log(target, receiver);
      return Reflect.set(target, key, value, receiver);
    },
  }
);
Object.setPrototypeOf(child, parent);
child.foo = 1;
child 会触发 parent上的 set
 * 
 */

function createSetter() {
  return function (target, key, value, receiver) {
    // 注意源码中的 target === toRaw(receiver)，目前暂未实现
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, 'set', key, value, oldValue);
    }
    return result;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};
