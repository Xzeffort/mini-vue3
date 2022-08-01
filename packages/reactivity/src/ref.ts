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
