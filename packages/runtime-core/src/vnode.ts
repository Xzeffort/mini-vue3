import { isArray, isObject, isString, ShapeFlags } from '@vue/shared';

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

export function isVnode(value) {
  return !!(value && value['_v__isVnode']);
}

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

export function normalizeVNode(child) {
  //  源码这里还有其他类型判断 https://github.com/vuejs/core/blob/main/packages/runtime-core/src/vnode.ts
  // strings and numbers
  if (isString(child) || typeof child === 'number') {
    child = createVnode(Text, null, String(child));
  }
  return child;
}

export function createVnode(type, props, children) {
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vnode = {
    _v__isVnode: true,
    type,
    props,
    children,
    key: props && props['key'], // 虚拟dom唯一标识 diff算法
    shapeFlag,
    el: null,
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      vnode.children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag |= type;
  }
  return vnode;
}
