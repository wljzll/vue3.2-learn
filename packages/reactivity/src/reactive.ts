import { isObject } from '@vue/shared';
import { track, trigger } from './effect';

const reactiveMap = new WeakMap(); // 缓存列表-缓存已经reactive的数据
const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}
const mutableHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    // receiver 代理后返回的proxy实例
    // console.log(target, key, receiver, 'get');
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 取proxy实例的ReactiveFlags.IS_REACTIVE属性 直接返回true
      return true;
    }
    const res = Reflect.get(target, key, receiver); // 这里必须要使用Reflect进行操作，保证this指向永远指向代理对象
    track(target, 'get', key); // 取值时进行依赖收集
    return res;
  },
  set(target, key, value, receiver) {
    // console.log(target, key, value, receiver, 'set');
    let oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) { // 设置的新值和老值不同触发更新
      trigger(target, 'set', key, value, oldValue);
    }
    return result;
  },
};

function createReactiveObject(target: object, isReadonly: boolean) {
  if (target[ReactiveFlags.IS_REACTIVE]) {
    // 存在ReactiveFlags.IS_REACTIVE属性说明已经代理过 直接返回proxy实例
    return target;
  }
  if (!isObject(target)) {
    // 非Object无法Proxy
    return target;
  }
  const exisitingProxy = reactiveMap.get(target); // 从缓存列表中获取本次要reactive的目标
  if (exisitingProxy) {
    // 如果缓存列表中存在 则取出直接返回
    return exisitingProxy;
  }

  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
// 常用的就是reactive方法
export function reactive(target: object) {
  return createReactiveObject(target, false);
}
// 后面的方法，不是重点我们先不进行实现...
/*
export function shallowReactive(target: object) {
    return createReactiveObject(target, false)
}
export function readonly(target: object) {
    return createReactiveObject(target, true)
}
export function shallowReadonly(target: object) {
    return createReactiveObject(target, true)
}
*/

/**
 * 1. 调用reactive方法
 * 2. reactive调用createReactiveObject方法
 *    2.1) 已经proxy代理过 直接返回proxy实例
 *    2.2) 未被代理过, 非对象直接返回原始值
 *    2.3) 是未被代理过的对象, 代理, 存入缓存
 *    2.4) 返回proxy实例
 */
