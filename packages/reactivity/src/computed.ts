import { isFunction } from '@vue/shared';
import {
  ReactiveEffect,
  track,
  trackEffects,
  trigger,
  triggerEffects,
} from './effect';

export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);
  let getter = null;
  let setter = null;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
      console.warn('Write operation failed: computed value is readonly');
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
};

class ComputedRefImpl {
  public _value;
  public effect;
  // 脏值 flag
  public _dirty = true;
  public readonly __v_isRef = true;
  public readonly __v_Readonly = true;
  public deps = new Set();
  constructor(public getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        // 3.2 版本前 trigger(toRaw(this), TriggerOpTypes.SET, 'value')
        triggerEffects(this.deps);
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    // 3.2 版本前是利用track(this, 'get', 'value')收集依赖的;
    trackEffects(this.deps);
    return this._value;
  }

  set value(val) {
    this.setter(val);
  }
}
