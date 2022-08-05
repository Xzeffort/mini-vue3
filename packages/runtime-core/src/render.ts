import { ShapeFlags } from '@vue/shared';
import { normalizeVNode, Text } from './vnode';
export function createRenderer(renderOptions) {
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
    nextSibling: hostNextSibling,
  } = renderOptions;

  const mountChildren = (children, container) => {
    for (let index = 0; index < children.length; index++) {
      const element = normalizeVNode(children[index]);
      patch(null, element, container);
    }
  };

  const mountElement = (vnode, container) => {
    const { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type));
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };

  const patch = (n1, n2, container) => {
    if (n1 === n2) return;
    if (n1 === null) {
      // 首次渲染
      const { type, shapeFlag } = n2;
      switch (type) {
        case Text:
          processText(n1, n2, container, null);
          break;
        default:
          if (shapeFlag & ShapeFlags.ELEMENT) {
            mountElement(n2, container);
          }
      }
    } else {
      // 更新操作
    }
  };
  const render = (vnode, container) => {
    if (vnode === null) {
      // 卸载操作(前提已经渲染过)
      if (container._vnode) {
        unmound(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };

  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateText(n2.children as string)),
        container,
        anchor
      );
    } else {
      const el = (n2.el = n1.el!);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string);
      }
    }
  };

  const unmound = (vnode) => {
    hostRemove(vnode.el);
  };

  return {
    render,
  };
}
