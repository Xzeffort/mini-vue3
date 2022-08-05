import { createRenderer } from '@vue/runtime-core';
import { extend } from '@vue/shared';
import { nodeOps } from './nodeOps';
import { patchProp } from './patchProp';

// 渲染配置两部分组成： 操作dom的api 和 操作属性的api
const rendererOptions = extend(nodeOps, { patchProp });

export function render(vnode, container) {
  // 将对应平台dom、属性渲染配置传入渲染构造方法生成对应平台的渲染器
  createRenderer(rendererOptions).render(vnode, container);
}

export * from '@vue/runtime-core';
