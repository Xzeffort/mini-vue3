import { trackEffects, triggerEffects } from './effect';
import { toReactive } from './reactive';

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
