import { reactive } from '@vue/reactivity';
import { hasOwn } from '@vue/shared';

export function initProps(instance, rawProps) {
  const props: any = {};
  const attrs: any = {};

  const options = instance.propsOptions || {};
  // 如果组件上声明了props，那么这种props会被认为是真正的props，否则会被认为attrs
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key];
      if (hasOwn(options, key)) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  // TODO 这里应该用shallowReactive
  //  主要是不希望子组件修改props
  instance.props = reactive(props);
  instance.attrs = attrs;
}

export function updateProps(instance, preProps, nextProps) {
  // 考虑到两点：1. 值的变化 2. props的个数变化
  if (hasPropsChanged(preProps, nextProps)) {
    for (const key in nextProps) {
      instance.props[key] = nextProps[key];
    }
    //  删除不存在的属性
    for (const key in instance.props) {
      if (!hasOwn(nextProps, key)) {
        delete instance.props[key];
      }
    }
  }
}

function hasPropsChanged(preProps = {}, nextProps = {}) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(preProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (preProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}
