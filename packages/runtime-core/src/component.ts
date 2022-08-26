import { proxyRefs, reactive } from '@vue/reactivity';
import { hasOwn, isFunction, isObject } from '@vue/shared';
import { initProps } from './componentProps';

export function createComponentInstance(vnode) {
  const instance: any = {
    data: null,
    vnode,
    subTree: null, // 渲染的内容
    isMounted: false, // 是否挂载,
    update: null, // 强制更新方法
    propsOptions: vnode.type.props || {}, // 组件上声明接收的props选项
    props: {}, // 与props选项一致
    attrs: {}, // 除所有props选项外的props，被认定为attrs
    proxy: null,
    render: null,
    setupState: {},
  };
  return instance;
}

const publicPropertyMap = {
  $attrs: (i) => i.attrs,
};

const publicInstanceProxy = {
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
      // 组件不允许直接修改props
      console.warn('组件无法修改props:' + (key as string));
      return false;
    }
    return true;
  },
};

export function setupComponent(instance) {
  const { props, type } = instance.vnode;
  // 初始化props和attrs
  initProps(instance, props);
  // 建立proxy，为了让render函数能够间接访问data等数据
  instance.proxy = new Proxy(instance, publicInstanceProxy);
  const data = type.data;
  if (data) {
    if (!isFunction(data)) {
      console.warn('组件中的 data 必须为函数');
      return;
    }
    // 给data绑定this，因为有可能利用this访问一些属性
    instance.data = reactive(data.call(instance.proxy));
  }
  const setup = type.setup;
  if (setup) {
    const setupContext = {};
    const setupResult = setup(instance.props, setupContext);
    if (isFunction(setupResult)) {
      // 注意： setup 如果返回函数则是render函数
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      // proxyRefs 脱ref，不需要再次.value取值
      instance.setupState = proxyRefs(setupResult);
    }
  }
  if (!instance.render) {
    // 绑定render函数在组件实例上
    instance.render = type.render;
  }
}
