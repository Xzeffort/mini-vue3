var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    ReactiveEffect: () => ReactiveEffect,
    computed: () => computed,
    effect: () => effect,
    isProxy: () => isProxy,
    isReactive: () => isReactive,
    isReadonly: () => isReadonly,
    isRef: () => isRef,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    reactiveMap: () => reactiveMap,
    readonly: () => readonly,
    readonlyMap: () => readonlyMap,
    ref: () => ref,
    toRaw: () => toRaw,
    toReactive: () => toReactive,
    toReadonly: () => toReadonly,
    toRef: () => toRef,
    toRefs: () => toRefs,
    unref: () => unref,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isArray = Array.isArray;

  // packages/reactivity/src/effect.ts
  var activeEffect = null;
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.parent = null;
      this.active = true;
      this.deps = [];
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let deps = depsMap.get(key);
    if (!deps) {
      depsMap.set(key, deps = /* @__PURE__ */ new Set());
    }
    trackEffects(deps);
  }
  function trackEffects(deps) {
    let shouldTrack = deps.has(activeEffect);
    if (!shouldTrack && activeEffect) {
      deps.add(activeEffect);
      activeEffect.deps.push(deps);
    }
  }
  function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    effects = [...effects];
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }
  function cleanEffect(effect2) {
    const { deps } = effect2;
    for (let index = 0; index < deps.length; index++) {
      deps[index].delete(effect2);
    }
    effect2.deps.length = 0;
  }

  // packages/reactivity/src/computed.ts
  var computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter = null;
    let setter = null;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("Write operation failed: computed value is readonly");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  };
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this._dirty = true;
      this.__v_isRef = true;
      this.__v_Readonly = true;
      this.deps = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.deps);
        }
      });
    }
    get value() {
      if (this._dirty) {
        this._value = this.effect.run();
        this._dirty = false;
      }
      trackEffects(this.deps);
      return this._value;
    }
    set value(val) {
      this.setter(val);
    }
  };

  // packages/reactivity/src/baseHandlers.ts
  var get = createGetter();
  var readonlyGet = createGetter(true);
  var set = createSetter();
  function createGetter(isReadonly2 = false) {
    return function(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return !isReadonly2;
      } else if (key === "__v_isReadonly" /* IS_READONLY */) {
        return isReadonly2;
      } else if (key === "__v_raw" /* RAW */ && receiver === (isReadonly2 ? readonlyMap : reactiveMap).get(target)) {
        return target;
      }
      let res = Reflect.get(target, key, receiver);
      if (!isReadonly2) {
        track(target, "get", key);
      }
      if (isObject(res)) {
        res = isReadonly2 ? readonly(res) : reactive(res);
      }
      return res;
    };
  }
  function createSetter() {
    return function(target, key, value, receiver) {
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, "set", key, value, oldValue);
      }
      return result;
    };
  }
  var mutableHandlers = {
    get,
    set
  };
  var readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
      console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
      return true;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  var readonlyMap = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers, reactiveMap);
  }
  function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers, readonlyMap);
  }
  function createReactiveObject(target, isReadonly2, baseHandlers, proxyMap) {
    if (!isObject(target)) {
      console.warn(`value cannot be made reactive: ${String(target)}`);
      return;
    }
    if (!isReadonly2 && target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    if (proxyMap.has(target)) {
      return proxyMap.get(target);
    }
    const proxy = new Proxy(target, baseHandlers);
    proxyMap.set(target, proxy);
    return proxy;
  }
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  function isReadonly(value) {
    return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
  }
  var toReactive = (value) => isObject(value) ? reactive(value) : value;
  var toReadonly = (value) => isObject(value) ? readonly(value) : value;
  function isProxy(value) {
    return isReactive(value) || isReadonly(value);
  }
  function toRaw(value) {
    const raw = value && value["__v_raw" /* RAW */];
    return raw ? toRaw(raw) : value;
  }

  // packages/reactivity/src/watch.ts
  function watch(source, cb) {
    let getter = null;
    let oldValue = void 0;
    if (isReactive(source)) {
      getter = () => traverse(source);
    } else if (isFunction) {
      getter = source;
    }
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
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }
  function traverse(obj, set2 = /* @__PURE__ */ new Set()) {
    if (!isObject(obj))
      return obj;
    if (set2.has(obj))
      return obj;
    set2.add(obj);
    for (const key in obj) {
      traverse(obj[key], set2);
    }
    return obj;
  }

  // packages/reactivity/src/ref.ts
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.deps = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
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
  };
  function ref(value) {
    if (isRef(value)) {
      return value;
    }
    return new RefImpl(value);
  }
  function isRef(r) {
    return !!(r && r.__v_isRef === true);
  }
  var ObjectRefImpl = class {
    constructor(obj, key) {
      this.obj = obj;
      this.key = key;
      this.__v_isRef = true;
    }
    get value() {
      return this.obj[this.key];
    }
    set value(newValue) {
      this.obj[this.key] = newValue;
    }
  };
  function toRef(obj, key) {
    const val = obj[key];
    return isRef(val) ? val : new ObjectRefImpl(obj, key);
  }
  function toRefs(obj) {
    const ret = {};
    for (const key in obj) {
      ret[key] = toRef(obj, key);
    }
    return ret;
  }
  function proxyRefs(obj) {
    return isReactive(obj) ? obj : new Proxy(obj, {
      get(target, key, receiver) {
        return unref(Reflect.get(target, key, receiver));
      },
      set(target, key, newValue, receiver) {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(newValue)) {
          oldValue.value = newValue;
          return true;
        } else {
          return Reflect.set(target, key, newValue, receiver);
        }
      }
    });
  }
  function unref(ref2) {
    return isRef(ref2) ? ref2.value : ref2;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
