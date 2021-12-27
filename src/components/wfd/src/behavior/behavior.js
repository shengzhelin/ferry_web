const Util = require('../util')
const Behavior = {}

/**
 * 注冊行為的方法
 * @param {string} type 行為類型，外部引用指定必須，不要與已有行為類型重名
 * @param {object} behavior 行為內容,包含元素詳見augment內容
 */
Behavior.registerBehavior = function(type, behavior) {
  if (!behavior) {
    throw new Error('please specify handler for this behavior:' + type)
  }
  const base = function(cfg) {
    const self = this
    Util.mix(self, self.getDefaultCfg(), cfg)
    const events = self.getEvents()
    if (events) {
      const eventsToBind = {}
      Util.each(events, (handler, event) => {
        eventsToBind[event] = Util.wrapBehavior(self, handler)
      })
      this._events = eventsToBind
    }
  }
  Util.augment(base, {
    /**
     * 是否阻止行為發生，默認不阻止
     * @return {boolean} 返回false時不觸發行為
     */
    shouldBegin() {
      return true
    },
    /**
     * 是否阻止行為更新數據，更改視圖
     * @return {boolean} 返回false時更新數據
     */
    shouldUpdate() {
      return true
    },
    /**
     * 是否阻止行為進入終止態
     * @return {boolean} 返回false時阻止
     */
    shouldEnd() {
      return true
    },
    /**
     * 定義行為的事件監聽handler，behavior內部會自動綁定事件。
     * 例如： return { click: 'onClick' }, 內部會監聽graph的click事件，觸發this.onClick
     */
    getEvents() {},
    /**
     * 綁定事件，默認綁定getEvents返回事件，不需要覆寫
     * @param {object} graph 畫布實例
     */
    bind(graph) {
      const events = this._events
      this.graph = graph
      Util.each(events, (handler, event) => {
        graph.on(event, handler)
      })
    },
    /**
     * 解綁事件，多用於切換行為模式，默認解綁getEvents返回事件，覆寫bind時需要同時覆寫unbind
     * @param {object} graph 畫布實例
     */
    unbind(graph) {
      const events = this._events
      Util.each(events, (handler, event) => {
        graph.off(event, handler)
      })
    },
    get(val) {
      return this[val]
    },
    set(key, val) {
      this[key] = val
      return this
    },
    /**
     * 定義自定義行為的默認參數，會與用戶傳入的參數進行合並
     */
    getDefaultCfg() {}
  }, behavior)
  Behavior[type] = base
}

Behavior.hasBehavior = function(type) {
  return !!Behavior[type]
}

Behavior.getBehavior = function(type) {
  return Behavior[type]
}

module.exports = Behavior

