import { ShapeFlags } from '@vue/shared';
import { isSameVnode, normalizeVNode, Text } from './vnode';
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
      // https://github.com/vuejs/core/blob/main/packages/runtime-core/src/vnode.ts normalizeVNode
      // normalizeVNode 对文本类型特殊处理，同时如果 children[index] 不是VNode类型 让 children[index] 变成 VNode 类型
      const element = (children[index] = normalizeVNode(children[index]));
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

  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;

    if (n1 && !isSameVnode(n1, n2)) {
      // 假设 n1 存在， 如果老的节点和新的节点类型不同，那么直接进行替换操作（同层比较，节点类型不同直接替换）
      unmount(n1);
      n1 = null; // 置为null，便于让后面变成新增操作
    }

    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        }
    }
  };
  const render = (vnode, container) => {
    if (vnode === null) {
      // 卸载操作(前提已经渲染过)
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
      hostInsert(
        (n2.el = hostCreateText(n2.children as string)),
        container,
        anchor
      );
    } else {
      // 文本更新，节点复用，注意文本 children只能为文本
      const el = (n2.el = n1.el!);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children as string);
      }
    }
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container);
    } else {
      // 更新操作
      patchElement(n1, n2, container, anchor);
    }
  };

  const patchElement = (n1, n2, container, anchor) => {
    const el = (n2.el = n1.el!);

    //  更新 props
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);

    // 更新孩子节点
    patchChildren(n1, n2, el);
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  const patchProps = (oldProps, newProps, el) => {
    // 添加新值以及更新老值
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 删除不存在的老值
    for (const key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };

  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;

    const preShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 数组 ==> 文本
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      // 满足 空 ==> 文本 文本 ==> 文本
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      //  现在 n2 为数组 或者 空
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff 算法
        } else {
          //  之前是数组，现在不是数组
          unmountChildren(c1); // 数组 ==> 空 (在现有条件下：之前分支文本已经被判断)
        }
      } else {
        if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 之前是文本，现在是其他，先清空文本然后在挂载
          hostSetElementText(el, '');
        }
        // 如果现在是数组，就进行挂载
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  // 卸载所有孩子
  const unmountChildren = (children) => {
    for (let index = 0; index < children.length; index++) {
      unmount(children[index]);
    }
  };

  return {
    render,
  };
}
