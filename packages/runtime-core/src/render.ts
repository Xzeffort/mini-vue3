import { ShapeFlags } from '@vue/shared';
import { Fragment, isSameVnode, normalizeVNode, Text } from './vnode';
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

  const mountChildren = (children, container, anchor) => {
    for (let index = 0; index < children.length; index++) {
      // https://github.com/vuejs/core/blob/main/packages/runtime-core/src/vnode.ts normalizeVNode
      // normalizeVNode 对文本类型特殊处理，同时如果 children[index] 不是VNode类型 让 children[index] 变成 VNode 类型
      const element = (children[index] = normalizeVNode(children[index]));
      patch(null, element, container, anchor);
    }
  };

  const mountElement = (vnode, container, anchor) => {
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
      mountChildren(children, el, null);
    }
    hostInsert(el, container, anchor);
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
      case Fragment:
        processFragment(n1, n2, container, anchor); // 碎片化节点 vue3 新增
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

  const processFragment = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountChildren(n2.children, container, anchor);
    } else {
      patchChildren(n1, n2, container, anchor);
    }
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 挂载操作
      mountElement(n2, container, anchor);
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

  const patchProps = (oldProps, newProps, container) => {
    // 添加新值以及更新老值
    for (const key in newProps) {
      hostPatchProp(container, key, oldProps[key], newProps[key]);
    }
    // 删除不存在的老值
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

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 数组 ==> 文本
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      // 满足 空 ==> 文本 文本 ==> 文本
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      //  现在 n2 为数组 或者 空
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff 算法
          patchKeyedChildren(c1, c2, container); // 全量比较
        } else {
          //  之前是数组，现在不是数组
          unmountChildren(c1); // 数组 ==> 空 (在现有条件下：之前分支文本已经被判断)
        }
      } else {
        if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 之前是文本，现在是其他，先清空文本然后在挂载
          hostSetElementText(container, '');
        }
        // 如果现在是数组，就进行挂载
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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

    // 1. sync from start
    // (a b) c
    // (a b) d e
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = (c2[i] = normalizeVNode(c2[i]));
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      i++;
    }

    // 2. sync from end
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = (c2[e2] = normalizeVNode(c2[e2]));
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, container);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 3. common sequence + mount
    // (a b)
    // (a b) c
    // i = 2, e1 = 1, e2 = 2
    // (a b)
    // c (a b)
    // i = 0, e1 = -1, e2 = 0
    if (i > e1) {
      // 存在新增节点
      // nextPos 取参照物，
      // 例如 abc ==> dxabc 此时 i=0 e1=-1 e2=1,取 a 为 anchor（参照物）进行插入
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
      if (i <= e2) {
        while (i <= e2) {
          patch(null, (c2[i] = normalizeVNode(c2[i])), container, anchor);
          i++;
        }
      }
    }
    // 4. common sequence + unmount
    // (a b) c
    // (a b)
    // i = 2, e1 = 2, e2 = 1
    // a (b c)
    // (b c)
    // i = 0, e1 = 0, e2 = -1
    else if (i > e2) {
      // 删除节点
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    }
    //  总结下： i > e1 的情况下，如果 i <= e2 有新增节点
    //  i > e2 的情况下，如果 i <= e1 有删除的节点

    //  接下来 乱序比较
    // 5. unknown sequence
    // [i ... e1 + 1]: a b [c d e] f g
    // [i ... e2 + 1]: a b [e d c h] f g
    // i = 2, e1 = 4, e2 = 5

    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = new Map();
    // {'e' => 2, 'd' => 3, 'c' => 4, 'h' => 5}
    for (i = s2; i <= e2; i++) {
      const nextChild = (c2[i] = normalizeVNode(c2[i]));
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i);
      }
    }

    // 需要更新的节点个数
    const toBePatched = e2 - s2 + 1;
    // 记录节点中谁被 patch 过，并且记录原来老的位置在哪，特殊情况：如果为 value为 0 说明是新增节点
    const newIndexToOldIndexMap = new Array(toBePatched);
    for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

    // 5.2 loop through old children left to be patched and try to patch
    // matching nodes & remove nodes that are no longer present
    // patch老节点 和 删除老节点
    for (i = s1; i <= e1; i++) {
      const oldChild = c1[i];
      // 获取节点现在的新位置
      const newIndex = keyToNewIndexMap.get(oldChild.key);
      if (newIndex === undefined) {
        unmount(oldChild);
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        patch(oldChild, c2[newIndex], container, parentAnchor);
      }
    }

    // 5.3 move and mount
    // generate longest stable subsequence only when nodes have moved
    // 移动位置
    const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
    let j = increasingNewIndexSequence.length - 1;
    for (let i = toBePatched - 1; i >= 0; i--) {
      const index = s2 + i;
      const current = c2[index];
      const anchor = index + 1 < l2 ? c2[index + 1].el : parentAnchor;

      // 新增节点
      if (newIndexToOldIndexMap[i] === 0) {
        //  newIndexToOldIndexMap ==> [5, 4, 3, 0]
        patch(null, current, container, anchor);
      } else {
        //  根据递增子序列，筛选出需要移动的节点
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          hostInsert(current.el, container, anchor);
        } else {
          j--;
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

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
  const len = arr.length;
  const p = Array(len).fill(0); // 记录前驱的数组
  let start;
  let end;
  let middle;
  const result = [0];
  let resultLastIndex;
  for (let index = 0; index < len; index++) {
    const arrI = arr[index];
    if (arrI !== 0) {
      // 忽略 0 因为 0 表示新增节点
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        // 比较最后一项的值，如果当前值比它大，则直接加入到结果集中
        // 这里拿的是索引
        result.push(index);
        p[index] = resultLastIndex;
        continue;
      }
      // 不满足上述条件则，利用 二分查找 去找比当前大的边界值
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = (start + end) >> 1;
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
  let last = result[i]; // 最后一项肯定是对的
  while (i >= 0) {
    result[i] = last;
    last = p[last];
    i--;
  }
  return result;
}
