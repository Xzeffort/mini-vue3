import { isArray, isObject } from '@vue/shared';
import { createVnode, isVnode } from './vnode';

/*
// type only
h('div')
// type + props
h('div', {})
// type + omit props + children
// Omit props does NOT support named slots
h('div', []) // array
h('div', 'foo') // text
h('div', h('br')) // vnode
h(Component, () => {}) // default slot
// type + props + children
h('div', {}, []) // array
h('div', {}, 'foo') // text
h('div', {}, h('br')) // vnode
h(Component, {}, () => {}) // default slot
h(Component, {}, {}) // named slots
// named slots without props requires explicit `null` to avoid ambiguity
h(Component, null, {})
**/
// https://github.com/vuejs/core/blob/cdda49bbfb/packages/runtime-core/src/h.ts
export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // single vnode without props
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      // props without children
      return createVnode(type, propsOrChildren, null);
    } else {
      // omit props
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      // children = Array.from(arguments).slice(2);
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}
