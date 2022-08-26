var VueRuntimeDOM = (() => {
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

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    ReactiveEffect: () => ReactiveEffect,
    Text: () => Text,
    computed: () => computed,
    createRenderer: () => createRenderer,
    effect: () => effect,
    h: () => h,
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
    render: () => render,
    toRaw: () => toRaw,
    toReactive: () => toReactive,
    toReadonly: () => toReadonly,
    toRef: () => toRef,
    toRefs: () => toRefs,
    unref: () => unref,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasOwn = (val, key) => hasOwnProperty.call(val, key);
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isString = (value) => typeof value === "string";
  var isArray = Array.isArray;
  var extend = Object.assign;
  var onRE = /^on[^a-z]/;
  var isOn = (key) => onRE.test(key);

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

  // packages/runtime-core/src/vnode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  function isVnode(value) {
    return !!(value && value["_v__isVnode"]);
  }
  function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function normalizeVNode(child) {
    if (isString(child) || typeof child === "number") {
      child = createVnode(Text, null, String(child));
    }
    return child;
  }
  function createVnode(type, props, children) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vnode = {
      _v__isVnode: true,
      type,
      props,
      children,
      key: props && props["key"],
      shapeFlag,
      el: null
    };
    if (children) {
      let type2 = 0;
      if (isArray(children)) {
        type2 = 16 /* ARRAY_CHILDREN */;
      } else if (isObject(children)) {
        type2 = 32 /* SLOTS_CHILDREN */;
      } else {
        vnode.children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag |= type2;
    }
    return vnode;
  }

  // packages/runtime-core/src/componentProps.ts
  function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};
    const options = instance.propsOptions || {};
    if (rawProps) {
      for (const key in rawProps) {
        const value = rawProps[key];
        if (hasOwn(options, key)) {
          props[key] = value;
        } else {
          attrs[key] = value;
        }
      }
    }
    instance.props = reactive(props);
    instance.attrs = attrs;
  }
  function updateProps(preProps, nextProps) {
    if (hasPropsChanged(preProps, nextProps)) {
      for (const key in nextProps) {
        preProps[key] = nextProps[key];
      }
      for (const key in nextProps) {
        if (!hasOwn(nextProps, key)) {
          delete preProps[key];
        }
      }
    }
  }
  function hasPropsChanged(preProps = {}, nextProps = {}) {
    const nextKeys = Object.keys(nextProps);
    if (nextKeys.length !== Object.keys(preProps).length) {
      return true;
    }
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      if (preProps[key] !== nextProps[key]) {
        return true;
      }
    }
    return false;
  }

  // packages/runtime-core/src/component.ts
  function createComponentInstance(vnode) {
    const instance = {
      data: null,
      vnode,
      subTree: null,
      isMounted: false,
      update: null,
      propsOptions: vnode.type.props || {},
      props: {},
      attrs: {},
      proxy: null,
      render: null,
      setupState: {},
      slots: {}
    };
    return instance;
  }
  var publicPropertyMap = {
    $attrs: (i) => i.attrs,
    $slots: (i) => i.slots
  };
  var publicInstanceProxy = {
    get(target, key) {
      const { data, props, setupState } = target;
      if (data && hasOwn(data, key)) {
        return data[key];
      } else if (setupState && hasOwn(setupState, key)) {
        return setupState[key];
      } else if (props && hasOwn(props, key)) {
        return props[key];
      }
      const getter = publicPropertyMap[key];
      if (getter) {
        return getter(target);
      }
    },
    set(target, key, value) {
      const { data, props, setupState } = target;
      if (data && hasOwn(data, key)) {
        data[key] = value;
        return true;
      } else if (setupState && hasOwn(setupState, key)) {
        setupState[key] = value;
        return true;
      } else if (props && hasOwn(props, key)) {
        console.warn("\u7EC4\u4EF6\u65E0\u6CD5\u4FEE\u6539props:" + key);
        return false;
      }
      return true;
    }
  };
  function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
      instance.slots = children;
    }
  }
  function setupComponent(instance) {
    const { props, type, children } = instance.vnode;
    initProps(instance, props);
    initSlots(instance, children);
    instance.proxy = new Proxy(instance, publicInstanceProxy);
    const data = type.data;
    if (data) {
      if (!isFunction(data)) {
        console.warn("\u7EC4\u4EF6\u4E2D\u7684 data \u5FC5\u987B\u4E3A\u51FD\u6570");
        return;
      }
      instance.data = reactive(data.call(instance.proxy));
    }
    const setup = type.setup;
    if (setup) {
      const setupContext = {
        emit: (event, ...args) => {
          const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
          const handler = instance.vnode.props[eventName];
          handler && handler(...args);
        },
        attrs: instance.attrs,
        slots: instance.slots,
        expose: () => {
        }
      };
      const setupResult = setup(instance.props, setupContext);
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
      }
    }
    if (!instance.render) {
      instance.render = type.render;
    }
  }

  // packages/runtime-core/src/scheduler.ts
  var queue = [];
  var isFlushing = false;
  var resolvePromise = Promise.resolve();
  function queueJob(job) {
    if (!queue.includes(job)) {
      queue.push(job);
    }
    if (!isFlushing) {
      isFlushing = true;
      resolvePromise.then(() => {
        isFlushing = false;
        const copy = queue.slice(0);
        queue.length = 0;
        for (let index = 0; index < copy.length; index++) {
          const job2 = copy[index];
          job2();
        }
        copy.length = 0;
      });
    }
  }

  // packages/runtime-core/src/render.ts
  function createRenderer(renderOptions) {
    const {
      insert: hostInsert,
      remove: hostRemove,
      patchProp: hostPatchProp,
      createElement: hostCreateElement,
      createText: hostCreateText,
      createComment: hostCreateComment,
      setText: hostSetText,
      setElementText: hostSetElementText,
      parentNode: hostParentNode,
      nextSibling: hostNextSibling
    } = renderOptions;
    const mountChildren = (children, container, anchor) => {
      for (let index = 0; index < children.length; index++) {
        const element = children[index] = normalizeVNode(children[index]);
        patch(null, element, container, anchor);
      }
    };
    const mountElement = (vnode, container, anchor) => {
      const { type, props, children, shapeFlag } = vnode;
      let el = vnode.el = hostCreateElement(type);
      if (props) {
        for (const key in props) {
          hostPatchProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el, null);
      }
      hostInsert(el, container, anchor);
    };
    const patch = (n1, n2, container, anchor = null) => {
      if (n1 === n2)
        return;
      if (n1 && !isSameVnode(n1, n2)) {
        unmount(n1);
        n1 = null;
      }
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container, anchor);
          break;
        case Fragment:
          processFragment(n1, n2, container, anchor);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(n1, n2, container, anchor);
          } else if (shapeFlag & 6 /* COMPONENT */) {
            processComponent(n1, n2, container, anchor);
          }
      }
    };
    const render2 = (vnode, container) => {
      if (vnode === null) {
        if (container._vnode) {
          unmount(container._vnode);
        }
      } else {
        patch(container._vnode || null, vnode, container);
      }
      container._vnode = vnode;
    };
    const processText = (n1, n2, container, anchor) => {
      if (n1 == null) {
        hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
      } else {
        const el = n2.el = n1.el;
        if (n2.children !== n1.children) {
          hostSetText(el, n2.children);
        }
      }
    };
    const processFragment = (n1, n2, container, anchor) => {
      if (n1 === null) {
        mountChildren(n2.children, container, anchor);
      } else {
        patchChildren(n1, n2, container, anchor);
      }
    };
    const processElement = (n1, n2, container, anchor) => {
      if (n1 === null) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2, container, anchor);
      }
    };
    const processComponent = (n1, n2, container, anchor) => {
      if (n1 === null) {
        mountComponent(n2, container, anchor);
      } else {
        updateComponent(n1, n2);
      }
    };
    const shouldUpdateComponent = (n1, n2) => {
      const { props: preProps } = n1;
      const { props: nextProps } = n2;
      if (preProps === nextProps)
        return false;
      return hasPropsChanged(preProps, nextProps);
    };
    const updateComponent = (n1, n2) => {
      const instance = n2.component = n1.component;
      if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance.update();
      }
    };
    const updateComponentPreRender = (instance, nextVNode) => {
      nextVNode.component = instance;
      instance.next = null;
      instance.vnode = nextVNode;
      updateProps(instance.props, nextVNode.props);
    };
    const mountComponent = (vnode, container, anchor) => {
      const instance = vnode.component = createComponentInstance(vnode);
      setupComponent(instance);
      setupRenderEffect(instance, container, anchor);
    };
    const setupRenderEffect = (instance, container, anchor) => {
      const { render: render3 } = instance;
      const componentUpdateFn = () => {
        if (!instance.isMounted) {
          const subTree = instance.subTree = render3.call(instance.proxy);
          patch(null, subTree, container, anchor);
          instance.isMounted = true;
        } else {
          const { next } = instance;
          if (next) {
            updateComponentPreRender(instance, next);
          }
          const subTree = render3.call(instance.proxy);
          patch(instance.subTree, subTree, container, anchor);
          instance.subTree = subTree;
        }
      };
      const effect2 = new ReactiveEffect(componentUpdateFn, () => {
        queueJob(instance.update);
      });
      const update = instance.update = effect2.run.bind(effect2);
      update();
    };
    const patchElement = (n1, n2, container, anchor) => {
      const el = n2.el = n1.el;
      let oldProps = n1.props || {};
      let newProps = n2.props || {};
      patchProps(oldProps, newProps, el);
      patchChildren(n1, n2, el);
    };
    const unmount = (vnode) => {
      hostRemove(vnode.el);
    };
    const patchProps = (oldProps, newProps, container) => {
      for (const key in newProps) {
        hostPatchProp(container, key, oldProps[key], newProps[key]);
      }
      for (const key in oldProps) {
        if (!newProps[key]) {
          hostPatchProp(container, key, oldProps[key], null);
        }
      }
    };
    const patchChildren = (n1, n2, container, anchor = null) => {
      const c1 = n1.children;
      const c2 = n2.children;
      const preShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag;
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unmountChildren(c1);
        }
        if (c1 !== c2) {
          hostSetElementText(container, c2);
        }
      } else {
        if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyedChildren(c1, c2, container);
          } else {
            unmountChildren(c1);
          }
        } else {
          if (preShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(container, "");
          }
          if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, container, anchor);
          }
        }
      }
    };
    const patchKeyedChildren = (c1, c2, container, parentAnchor = null) => {
      let i = 0;
      const l2 = c2.length;
      let e1 = c1.length - 1;
      let e2 = l2 - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i] = normalizeVNode(c2[i]);
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, container);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2] = normalizeVNode(c2[e2]);
        if (isSameVnode(n1, n2)) {
          patch(n1, n2, container);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        if (i <= e2) {
          while (i <= e2) {
            patch(null, c2[i] = normalizeVNode(c2[i]), container, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      } else {
        const s1 = i;
        const s2 = i;
        const keyToNewIndexMap = /* @__PURE__ */ new Map();
        for (i = s2; i <= e2; i++) {
          const nextChild = c2[i] = normalizeVNode(c2[i]);
          if (nextChild.key != null) {
            keyToNewIndexMap.set(nextChild.key, i);
          }
        }
        const toBePatched = e2 - s2 + 1;
        const newIndexToOldIndexMap = new Array(toBePatched);
        for (i = 0; i < toBePatched; i++)
          newIndexToOldIndexMap[i] = 0;
        for (i = s1; i <= e1; i++) {
          const oldChild = c1[i];
          const newIndex = keyToNewIndexMap.get(oldChild.key);
          if (newIndex === void 0) {
            unmount(oldChild);
          } else {
            newIndexToOldIndexMap[newIndex - s2] = i + 1;
            patch(oldChild, c2[newIndex], container, parentAnchor);
          }
        }
        const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        let j = increasingNewIndexSequence.length - 1;
        for (let i2 = toBePatched - 1; i2 >= 0; i2--) {
          const index = s2 + i2;
          const current = c2[index];
          const anchor = index + 1 < l2 ? c2[index + 1].el : parentAnchor;
          if (newIndexToOldIndexMap[i2] === 0) {
            patch(null, current, container, anchor);
          } else {
            if (j < 0 || i2 !== increasingNewIndexSequence[j]) {
              hostInsert(current.el, container, anchor);
            } else {
              j--;
            }
          }
        }
      }
    };
    const unmountChildren = (children) => {
      for (let index = 0; index < children.length; index++) {
        unmount(children[index]);
      }
    };
    return {
      render: render2
    };
  }
  function getSequence(arr) {
    const len = arr.length;
    const p = Array(len).fill(0);
    let start;
    let end;
    let middle;
    const result = [0];
    let resultLastIndex;
    for (let index = 0; index < len; index++) {
      const arrI = arr[index];
      if (arrI !== 0) {
        resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          result.push(index);
          p[index] = resultLastIndex;
          continue;
        }
        start = 0;
        end = result.length - 1;
        while (start < end) {
          middle = start + end >> 1;
          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          }
        }
        if (arr[result[end]] > arrI) {
          result[end] = index;
          p[index] = result[end - 1];
        }
      }
    }
    let i = result.length - 1;
    let last = result[i];
    while (i >= 0) {
      result[i] = last;
      last = p[last];
      i--;
    }
    return result;
  }

  // packages/runtime-core/src/h.ts
  function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l === 2) {
      if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
        if (isVnode(propsOrChildren)) {
          return createVnode(type, null, [propsOrChildren]);
        }
        return createVnode(type, propsOrChildren, null);
      } else {
        return createVnode(type, null, propsOrChildren);
      }
    } else {
      if (l > 3) {
        children = Array.prototype.slice.call(arguments, 2);
      } else if (l === 3 && isVnode(children)) {
        children = [children];
      }
      return createVnode(type, propsOrChildren, children);
    }
  }

  // packages/runtime-dom/src/nodeOps.ts
  var doc = typeof document !== "undefined" ? document : null;
  var nodeOps = {
    insert: (child, parent, anchor = null) => {
      parent.insertBefore(child, anchor);
    },
    remove: (child) => {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    createElement: (tagName) => {
      return doc.createElement(tagName);
    },
    setText: (node, text) => {
      node.nodeValue = text;
    },
    setElementText: (el, text) => {
      el.textContent = text;
    },
    createText: (text) => doc.createTextNode(text),
    createComment: (text) => doc.createComment(text),
    parentNode: (node) => node.parentNode,
    nextSibling: (node) => node.nextSibling,
    querySelector: (selector) => doc.querySelector(selector)
  };

  // packages/runtime-dom/src/modules/attrs.ts
  function patchAttr(el, key, nextValue) {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, value) {
    if (value === null) {
      el.removeAttribute("class");
    } else {
      el.className = value;
    }
  }

  // packages/runtime-dom/src/modules/events.ts
  function addEventListener(el, event, handler, options) {
    el.addEventListener(event, handler, options);
  }
  function removeEventListener(el, event, handler, options) {
    el.removeEventListener(event, handler, options);
  }
  function patchEvent(el, eventName, preValue, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let existingInvoker = invokers[eventName];
    if (existingInvoker && nextValue) {
      existingInvoker[eventName] = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        addEventListener(el, event, invoker);
      } else if (existingInvoker) {
        removeEventListener(el, event, existingInvoker);
      }
    }
  }
  function createInvoker(callback) {
    const invocker = (e) => {
      invocker.value(e);
    };
    invocker.value = callback;
    return invocker;
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, preValue, nextValue) {
    for (const key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (preValue) {
      for (let key in preValue) {
        if (nextValue[key] === null) {
          el.style[key] = null;
        }
      }
    }
  }

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, preValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, preValue, nextValue);
    } else if (isOn(key)) {
      patchEvent(el, key, preValue, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var rendererOptions = extend(nodeOps, { patchProp });
  function render(vnode, container) {
    createRenderer(rendererOptions).render(vnode, container);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
