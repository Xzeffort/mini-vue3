import { isArray, isString, ShapeFlags } from '@vue/shared';

export const Text = Symbol('Text');

export function isVnode(value) {
  return !!(value && value['_v__isVnode']);
}

export function normalizeVNode(child) {
  if (isString(child)) {
    return createVnode(Text, null, String(child));
  }
  return child;
}

export function createVnode(type, props, children) {
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

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
