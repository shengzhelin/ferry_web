const DEFAULT_TRIGGER = 'click'
const ALLOW_EVENTS = ['click', 'dblclick']
module.exports = {
  getDefaultCfg() {
    return {
      /**
       * 發生收縮/擴展變化時的回調
       */
      trigger: DEFAULT_TRIGGER,
      onChange() {}
    }
  },
  getEvents() {
    let trigger
    // 檢測輸入是否合法
    if (ALLOW_EVENTS.includes(this.trigger)) {
      trigger = this.trigger
    } else {
      trigger = DEFAULT_TRIGGER
      console.warn('Behavior collapse-expand的trigger參數不合法，請輸入click或dblclick')
    }
    return {
      [`node:${trigger}`]: 'onNodeClick'
    }
  },
  onNodeClick(e) {
    const item = e.item
    // 如果節點進行過更新，model 會進行 merge，直接改 model 就不能改佈局，所以需要去改源數據
    const sourceData = this.graph.findDataById(item.get('id'))
    const children = sourceData.children
    // 葉子節點的收縮和展開沒有意義
    if (!children || children.length === 0) {
      return
    }
    const collapsed = !sourceData.collapsed
    if (!this.shouldBegin(e, collapsed)) {
      return
    }
    sourceData.collapsed = collapsed
    item.getModel().collapsed = collapsed
    this.graph.emit('itemcollapsed', { item: e.item, collapsed })
    if (!this.shouldUpdate(e, collapsed)) {
      return
    }
    try {
      this.onChange(item, collapsed)
    } catch (e) {
      console.warn('G6 自 3.0.4 版本支持直接從 item.getModel() 獲取源數據(臨時通知，將在3.2.0版本中清除)', e)
    }
    this.graph.refreshLayout()
  }
}
