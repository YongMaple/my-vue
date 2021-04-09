// 数据响应式
function defineReactive(obj, key, val) {
  // 递归
  observe(val)

  // 创建一个对应的Dep实例
  const dep = new Dep() // 这里也是闭包，dep和key是一对一的对应关系

  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}:${val}`)

      // 依赖收集
      Dep.target && dep.addDep(Dep.target)

      return val
    },
    set(newVal) {
      if (newVal !== val) {
        observe(newVal)
        console.log(`set ${key}:${newVal}`)
        // 函数内部有一个函数，并把值暴露出去，形成了闭包
        val = newVal
        // update()
        // watchers.forEach((w) => w.update())
        dep.notify()
      }
    },
  })
}

// 递归遍历obj，动态拦截obj的所有key
function observe(obj) {
  if (typeof obj !== 'object' || obj == null) {
    return
  }
  // 创建Observer实例
  new Observer(obj)
}

// 响应式对象中的某个key只要是一个对象就要创建一个Observer实例
class Observer {
  // 核心功能：根据传入对象的类型做不同的相应处理
  constructor(obj) {
    if (Array.isArray(obj)) {
      // TODO: 数组处理
    } else {
      // 对象响应式
      this.walk(obj)
    }
  }

  walk(obj) {
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key])
    })
  }
}

function proxy(vm) {
  Object.keys(vm.$data).forEach((key) => {
    Object.defineProperty(vm, key, {
      get() {
        return vm.$data[key]
      },
      set(newVal) {
        vm.$data[key] = newVal
      },
    })
  })
}
class Compile {
  constructor(el, vm) {
    this.$vm = vm
    this.$el = document.querySelector(el)

    // 遍历宿主元素
    if (this.$el) {
      this.compile(this.$el)
    }
  }

  compile(el) {
    // 递归遍历根元素
    el.childNodes.forEach((node) => {
      if (this.isElement(node)) {
        console.log('编译元素', node.nodeName)
        this.compileElement(node)
      } else if (this.isInterpolation(node)) {
        console.log('编译插值文本', node.textContent)
        this.compileText(node)
      }
      // 递归
      if (node.childNodes.length > 0) {
        this.compile(node)
      }
    })
  }
  // 元素判断
  isElement(node) {
    return node.nodeType === 1
  }
  // 插值判断
  isInterpolation(node) {
    // 正则通过()分组，把{{}}中的内容放入RegExp中的$1
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }
  // 解析插值文本
  compileText(node) {
    this.update(node, RegExp.$1, 'text')
  }
  // 编译元素
  compileElement(node) {
    // 遍历所有属性：检查是否存在指令和事件
    const attrs = node.attributes
    Array.from(attrs).forEach((attr) => {
      console.log(attr)
      // 例如：v-text="counter"
      // attrName就是v-text
      // expression就是counter
      const attrName = attr.name
      const expression = attr.value

      // 只处理动态值
      // 指令 v-
      if (this.isDirective(attrName)) {
        // 希望执行一个指令处理函数
        const directive = attrName.substring(2)
        // 如果存在这个指令对应的函数就执行，比如v-text就执行text()
        this[directive] && this[directive](node, expression)
      }
    })
  }
  // 判断指令
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }
  // v-text
  text(node, expression) {
    this.update(node, expression, 'text')
  }

  textUpdater(node, val) {
    node.textContent = val
  }
  // v-html
  html(node, expression) {
    this.update(node, expression, 'html')
  }

  htmlUpdater(node, val) {
    node.innerHTML = val
  }

  update(node, expression, directive) {
    // 在解析指令时，不光要给它初始化，还要给它做更新函数的创建
    // 执行directive对应的实操函数
    const fn = this[directive + 'Updater']
    fn && fn(node, this.$vm[expression])

    // 创建Watcher
    new Watcher(this.$vm, expression, function (val) {
      // 形成闭包
      fn && fn(node, val)
    })
  }
}

// const watchers = []
// 更新执行者Watcher
class Watcher {
  constructor(vm, key, updater) {
    this.vm = vm
    this.key = key
    this.updater = updater

    // watchers.push(this)
    // 保存Watcher引用，放到静态变量里
    Dep.target = this
    // 放进去立刻读取，触发defineReactive中的get
    this.vm[this.key]
    Dep.target = null
  }

  update() {
    this.updater.call(this.vm, this.vm[this.key])
  }
}
class Dep {
  constructor() {
    this.deps = []
  }

  addDep(dep) {
    this.deps.push(dep)
  }

  notify() {
    this.deps.forEach((w) => w.update())
  }
}
class Vue {
  constructor(options) {
    this.$options = options
    this.$data = options.data

    // 对data做响应式处理
    observe(this.$data)
    // 代理
    proxy(this)

    new Compile(options.el, this)
  }
}
