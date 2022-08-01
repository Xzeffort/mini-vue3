import { trackEffects, triggerEffects } from './effect';
import { isReactive, toReactive } from './reactive';

class RefImpl {
  private _value;
  public deps = new Set();
  public readonly __v_isRef = true;
  constructor(private rawValue) {
    this._value = toReactive(rawValue);
  }

  get value() {
    trackEffects(this.deps);
    return this._value;
  }

  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = toReactive(newValue);
      triggerEffects(this.deps);
    }
  }
}

export function ref(value) {
  if (isRef(value)) {
    return value;
  }
  return new RefImpl(value);
}

export function isRef(r) {
  return !!(r && r.__v_isRef === true);
}

class ObjectRefImpl {
  public readonly __v_isRef = true;

  constructor(public obj, public key) {}

  get value() {
    return this.obj[this.key];
  }

  set value(newValue) {
    this.obj[this.key] = newValue;
  }
}

export function toRef(obj, key) {
  const val = obj[key];
  return isRef(val) ? val : new ObjectRefImpl(obj, key);
}

export function toRefs(obj) {
  const ret = {};
  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}

// 脱ref，模式渲染时候不用加value，就是使用了该方法
// 这里限制只支持对象类型
// proxyRefs({Ref(),...,Ref()})
export function proxyRefs<T extends object>(obj: T) {
  return isReactive(obj)
    ? obj
    : new Proxy(obj, {
        get(target, key, receiver) {
          return unref(Reflect.get(target, key, receiver));
        },
        set(target, key, newValue, receiver) {
          const oldValue = target[key];
          // 老值为ref，并且新值不为ref时候，说明是对老值ref的value赋值。
          if (isRef(oldValue) && !isRef(newValue)) {
            oldValue.value = newValue;
            return true;
          } else {
            return Reflect.set(target, key, newValue, receiver);
          }
        },
      });
}

export function unref(ref) {
  return isRef(ref) ? ref.value : ref;
}
