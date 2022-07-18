export let activeEffect = null;

class ReactiveEffect {
  public parent = null;
  public active = true; // effect 默认是激活状态
  public deps = []; // 记录该effect被多少属性收集了
  constructor(public fn) {}

  run() {
    if (!this.active) {
      // 非激活状态不进行依赖收集
      return this.fn();
    }
    // 进行依赖收集
    try {
      // 引入parent解决嵌套effect问题，老版本是用栈解决的。
      this.parent = activeEffect;
      activeEffect = this;

      // 分支切换，在执行函数之前，清空原来的依赖，重新收集。
      cleanEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn); // 创建响应式effect

  _effect.run(); // 默认先执行一次
}
// weakmap（对象） -- map（对象上的属性） -- set （effect函数）
// obj --> attribute --> [effect,...,...]
const targetMap = new WeakMap();
export function track(target, type, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  let shouldTrack = deps.has(activeEffect);
  if (!shouldTrack) {
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  let effects = depsMap.get(key);
  if (effects) {
    // 复制一遍，防止死循环
    // 原因：set 遍历，执行了删除依赖（cleanEffect），后续又进行了添加依赖（this.fn()），导致了死循环
    effects = [...effects];
    effects.forEach((effect) => {
      // 判断当前执行的effect是否是要在effect函数中可能要被重新触发的的依赖，防止重复执行
      // 例如 effetc 中 进行了赋值操作
      if (effect !== activeEffect) {
        effect.run();
      }
    });
  }
}

function cleanEffect(effect) {
  const { deps } = effect;
  for (let index = 0; index < deps.length; index++) {
    // 删除依赖，重新收集
    deps[index].delete(effect);
  }
  effect.deps.length = 0;
}
