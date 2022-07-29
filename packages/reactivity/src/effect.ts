export let activeEffect = null;

class ReactiveEffect {
  public parent = null;
  public active = true; // effect 默认是激活状态
  public deps = []; // 记录该effect被多少属性收集了
  constructor(public fn, public scheduler) {}

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

  stop() {
    if (this.active) {
      this.active = false;
      cleanEffect(this);
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler); // 创建响应式effect

  _effect.run(); // 默认先执行一次

  // effectScope 就是利用这个 https://v3.cn.vuejs.org/api/effect-scope.html#effectscope
  const runner = _effect.run.bind(_effect); // bind this，因为这里存在隐式丢失的问题
  runner.effect = _effect; // 将effect赋值到runner上，以便于后续调用
  return runner;
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
    // [Set1(), Set2(), ...]
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
        if (effect.scheduler) {
          // 如果存在自定义调度器则调用该调度器
          effect.scheduler();
        } else {
          effect.run();
        }
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
