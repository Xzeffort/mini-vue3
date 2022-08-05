export function addEventListener(
  el: Element,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
) {
  el.addEventListener(event, handler, options);
}

export function removeEventListener(
  el: Element,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions
) {
  el.removeEventListener(event, handler, options);
}

export function patchEvent(el, eventName, preValue, nextValue) {
  //  vei = vue event invokers
  let invokers = el._vei || (el._vei = {});

  let existingInvoker = invokers[eventName];

  if (existingInvoker && nextValue) {
    // 如果已存在事件，同时存在新方法，更新方法
    existingInvoker[eventName] = nextValue;
  } else {
    let event = eventName.slice(2).toLowerCase();
    if (nextValue) {
      // 不存在事件 ==> add
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      addEventListener(el, event, invoker);
    } else if (existingInvoker) {
      // 存在事件，但是nextValue不存在 ==> remove
      removeEventListener(el, event, existingInvoker);
    }
  }
}

//  这种方式还存在一点问题（与源代码比较，主要是异步问题），待修复
function createInvoker(callback) {
  // 下面实现方法值得借鉴，通过修改value值，改变实际执行方法
  // 不需要频繁删除原有方法了, 提升性能
  const invocker = (e) => {
    invocker.value(e);
  };
  invocker.value = callback;
  return invocker;
}
