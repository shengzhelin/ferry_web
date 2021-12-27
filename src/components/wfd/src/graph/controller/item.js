const Util = require('../../util')
const Item = require('../../item')
const deepMix = require('@antv/util/lib/deep-mix')

const NODE = 'node'
const EDGE = 'edge'
const CFG_PREFIX = 'default'
const MAPPER_SUFFIX = 'Mapper'
const STATE_SUFFIX = 'stateStyles'
const hasOwnProperty = Object.hasOwnProperty

class ItemController {
  constructor(graph) {
    this.graph = graph
  }
  addItem(type, model) {
    const graph = this.graph
    const parent = graph.get(type + 'Group') || graph.get('group')
    const upperType = Util.upperFirst(type)
    let item
    let styles = graph.get(type + Util.upperFirst(STATE_SUFFIX)) || {}
    const defaultModel = graph.get(CFG_PREFIX + upperType)
    const mapper = graph.get(type + MAPPER_SUFFIX)

    if (mapper) {
      const mappedModel = mapper(model)
      if (mappedModel[STATE_SUFFIX]) {
        styles = mappedModel[STATE_SUFFIX]
        delete mappedModel[STATE_SUFFIX]
      }

      // 如果配置了 defaultEdge 或 defaultNode，則將默認配置的數據也合並進去
      model = deepMix({}, defaultModel, model, mappedModel)
    } else if (defaultModel) {
      // 很多布局會直接修改原數據模型，所以不能用 merge 的形式，逐個寫入原 model 中
      Util.each(defaultModel, (val, cfg) => {
        if (!hasOwnProperty.call(model, cfg)) {
          if (Util.isObject(val)) {
            model[cfg] = Util.clone(val)
          } else {
            model[cfg] = defaultModel[cfg]
          }
        }
      })
    }
    graph.emit('beforeadditem', { type, model })
    if (type === EDGE) {
      let source = model.source
      let target = model.target
      if (source && Util.isString(source)) {
        source = graph.findById(source)
      }
      if (target && Util.isString(target)) {
        target = graph.findById(target)
      }
      if (!source || !target) {
        console.warn('The source or target node of edge ' + model.id + ' does not exist!')
        return
      }
      item = new Item[upperType]({
        model,
        source,
        target,
        styles,
        linkCenter: graph.get('linkCenter'),
        group: parent.addGroup()
      })
    } else {
      item = new Item[upperType]({
        model,
        styles,
        group: parent.addGroup()
      })
    }
    graph.get(type + 's').push(item)
    graph.get('itemMap')[item.get('id')] = item
    graph.autoPaint()
    graph.emit('afteradditem', { item, model })
    return item
  }
  updateItem(item, cfg) {
    const graph = this.graph
    if (Util.isString(item)) {
      item = graph.findById(item)
    }
    if (!item || item.destroyed) {
      return
    }
    // 如果修改了與映射屬性有關的數據項，映射的屬性相應也需要變化
    const mapper = graph.get(item.getType() + MAPPER_SUFFIX)
    const model = item.getModel()
    if (mapper) {
      const result = deepMix({}, model, cfg)
      const mappedModel = mapper(result)
      // 將 update 時候用戶傳入的參數與mapperModel做deepMix，以便覆用之前設置的參數值
      const newModel = deepMix({}, model, mappedModel, cfg)
      if (mappedModel[STATE_SUFFIX]) {
        item.set('styles', newModel[STATE_SUFFIX])
        delete newModel[STATE_SUFFIX]
      }
      Util.each(newModel, (val, key) => {
        cfg[key] = val
      })
    } else {
      // merge update傳進來的對象參數，model中沒有的數據不做處理，對象和字符串值也不做處理，直接替換原來的
      Util.each(cfg, (val, key) => {
        if (model[key]) {
          if (Util.isObject(val) && !Util.isArray(val)) {
            cfg[key] = Util.mix({}, model[key], cfg[key])
          }
        }
      })
    }
    graph.emit('beforeupdateitem', { item, cfg })
    if (item.getType() === EDGE) {
      // 若是邊要更新source || target, 為了不影響示例內部model，並且重新計算startPoint和endPoint，手動設置
      if (cfg.source) {
        let source = cfg.source
        if (Util.isString(source)) {
          source = graph.findById(source)
        }
        item.setSource(source)
      }
      if (cfg.target) {
        let target = cfg.target
        if (Util.isString(target)) {
          target = graph.findById(target)
        }
        item.setTarget(target)
      }
    }
    item.update(cfg)
    if (item.getType() === NODE) {
      const autoPaint = graph.get('autoPaint')
      graph.setAutoPaint(false)
      Util.each(item.getEdges(), edge => {
        graph.refreshItem(edge)
      })
      graph.setAutoPaint(autoPaint)
    }
    graph.autoPaint()
    graph.emit('afterupdateitem', { item, cfg })
  }
  removeItem(item) {
    const graph = this.graph
    if (Util.isString(item)) {
      item = graph.findById(item)
    }
    if (!item || item.destroyed) {
      return
    }
    graph.emit('beforeremoveitem', { item })
    const type = item.getType()
    const items = graph.get(item.getType() + 's')
    const index = items.indexOf(item)
    items.splice(index, 1)
    delete graph.get('itemMap')[item.get('id')]
    if (type === NODE) {
      // 若移除的是節點，需要將與之相連的邊一同刪除
      const edges = item.getEdges()
      for (let i = edges.length; i >= 0; i--) {
        graph.removeItem(edges[i])
      }
    }
    item.destroy()
    graph.autoPaint()
    graph.emit('afterremoveitem', { item })
  }
  setItemState(item, state, enabled) {
    const graph = this.graph
    if (item.hasState(state) === enabled) {
      return
    }
    graph.emit('beforeitemstatechange', { item, state, enabled })
    item.setState(state, enabled)
    graph.autoPaint()
    graph.emit('afteritemstatechange', { item, state, enabled })
  }
  clearItemStates(item, states) {
    const graph = this.graph
    if (Util.isString(item)) {
      item = graph.findById(item)
    }
    graph.emit('beforeitemstatesclear', { item, states })
    item.clearStates(states)
    graph.autoPaint()
    graph.emit('afteritemstatesclear', { item, states })
  }
  refreshItem(item) {
    const graph = this.graph
    if (Util.isString(item)) {
      item = graph.findById(item)
    }
    graph.emit('beforeitemrefresh', { item })
    item.refresh()
    graph.autoPaint()
    graph.emit('afteritemrefresh', { item })
  }
  changeItemVisibility(item, visible) {
    const self = this
    const graph = self.graph
    if (Util.isString(item)) {
      item = graph.findById(item)
    }
    graph.emit('beforeitemvisibilitychange', { item, visible })
    item.changeVisibility(visible)
    if (item.getType() === NODE) {
      const autoPaint = graph.get('autoPaint')
      graph.setAutoPaint(false)
      Util.each(item.getEdges(), edge => {
        // 若隱藏節點，則將與之關聯的邊也隱藏
        // 若顯示節點，則將與之關聯的邊也顯示，但是需要判斷邊兩端的節點都是可見的
        if (visible && (!(edge.get('source').isVisible() && edge.get('target').isVisible()))) {
          return
        }
        self.changeItemVisibility(edge, visible)
      })
      graph.setAutoPaint(autoPaint)
    }
    graph.autoPaint()
    graph.emit('afteritemvisibilitychange', { item, visible })
  }
  destroy() {
    this.graph = null
    this.destroyed = true
  }
}

module.exports = ItemController
