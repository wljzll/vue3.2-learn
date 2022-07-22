export let activeEffect = undefined; // 当前正在执行的effect

class ReactiveEffect {
  active = true;
  deps = []; // 收集effect中使用到的属性
  parent = undefined;
  constructor(public fn) {}
  run() {
    if (!this.active) {
      // ???
      // 不是激活状态
      return this.fn();
    }

    try {
      this.parent = activeEffect;
      console.log(this.parent, 'parent*************');
      activeEffect = this;
      console.log(activeEffect, 'activeEffect###################');
      console.log(this.parent, 'parent*************############');
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = undefined;
    }
  }
}

export function effect(fn, options?) {
  // 使用effect方法
  const _effect = new ReactiveEffect(fn); // 创建ReactiveEffect实例
  _effect.run(); // 执行run方法
}

const targetMap = new WeakMap(); // 记录依赖关系
export function track(target, type, key) {
  console.log('触发依赖收集');
  if (activeEffect) {
    // activeEffect存在 收集
    let depsMap = targetMap.get(target); // 取一下target
    if (!depsMap) {
      // 如果target没有被收集过
      targetMap.set(target, (depsMap = new Map())); // 创建一个对应关系 target: {key: }
    }
    let dep = depsMap.get(key); // 取一下对应的key 没收集过就是undefined
    if (!dep) {
      // 没收集过
      depsMap.set(key, (dep = new Set())); // 创建key与effect的对应关系
    }
    let shouldTrack = !dep.has(activeEffect); // 看一下对应的key是否已经建立了和effect的关系
    if (shouldTrack) {
      // 没建立过
      dep.add(activeEffect); // 建立下
      activeEffect.deps.push(dep); // effect也收集下key和effect的关系
    }
  }
}

export function trigger(target, type, key?, newValue?, oldValue?) {
  const depsMap = targetMap.get(target);
  if(!depsMap){
    return;
  }
  const effects = depsMap.get(key);
  effects && effects.forEach(effect => {
    if (effect !== activeEffect) effect.run();
  })
}


// 依赖收集的结构
// {
//   target: {
//     key: [effect1, effect2]
//   }
// }
