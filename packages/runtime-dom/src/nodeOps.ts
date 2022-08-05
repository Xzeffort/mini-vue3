// https://github.com/vuejs/core/blob/cdda49bbfb/packages/runtime-dom/src/nodeOps.ts

const doc = (typeof document !== 'undefined' ? document : null) as Document;

// 以配置的方式自定义dom的渲染方式
export const nodeOps = {
  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor);
  },

  remove: (child) => {
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child);
    }
  },

  // createElement: (tag, isSVG, is, props): Element => {
  //   const el = isSVG
  //     ? doc.createElementNS(svgNS, tag)
  //     : doc.createElement(tag, is ? { is } : undefined);

  //   if (tag === 'select' && props && props.multiple != null) {
  //     (el as HTMLSelectElement).setAttribute('multiple', props.multiple);
  //   }

  //   return el;
  // },

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

  parentNode: (node) => node.parentNode as Element | null,

  nextSibling: (node) => node.nextSibling,

  querySelector: (selector) => doc.querySelector(selector),
};
