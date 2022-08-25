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
