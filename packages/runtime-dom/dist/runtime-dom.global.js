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
    Text: () => Text,
    createRenderer: () => createRenderer,
    h: () => h,
    render: () => render
  });

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isString = (value) => typeof value === "string";
  var isArray = Array.isArray;
  var extend = Object.assign;
  var onRE = /^on[^a-z]/;
  var isOn = (key) => onRE.test(key);

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
    if (isString(child)) {
      child = createVnode(Text, null, String(child));
    }
    return child;
  }
  function createVnode(type, props, children) {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
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
      } else {
        vnode.children = String(children);
        type2 = 8 /* TEXT_CHILDREN */;
      }
      vnode.shapeFlag |= type2;
    }
    return vnode;
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
      }
      let s1 = i;
      let s2 = i;
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
