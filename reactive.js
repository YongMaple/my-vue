// 数据响应式
function defineReactive(obj, key, val) {
  // 递归
  observe(val)
  Object.defineProperty(obj, key, {
    get() {
      console.log(`get ${key}:${val}`)
      return val
    },
    set(newVal) {
      if (newVal !== val) {
        observe(newVal)
        console.log(`set ${key}:${newVal}`)
        // 函数内部有一个函数，并把值暴露出去，形成了闭包
        val = newVal
      }
    },
  })
}

// 递归遍历obj，动态拦截obj的所有key
function observe(obj) {
  if (typeof obj !== 'object' || obj == null) {
    return obj
  }
  Object.keys(obj).forEach((key) => {
    defineReactive(obj, key, obj[key])
  })
}

const obj = {
  foo: 'foo',
  bar: 'bar',
  baz: {
    a: 1,
  },
}
// defineReactive(obj, 'foo', 'foo')
observe(obj)

function set(obj, key, val) {
  defineReactive(obj, key, val)
}


// obj.foo
// obj.foo = 'foooooooooooo'
// obj.foo
// obj.bar
// obj.baz.a
// obj.baz = {
//   a: 10
// }
// obj.baz.a

// obj.dong = 'dong'

set(obj, 'dong', 'dong')
obj.dong