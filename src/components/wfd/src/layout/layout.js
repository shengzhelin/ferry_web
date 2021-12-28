/**
 * @fileOverview layout base file
 * @author shiwu.wyy@antfin.com
 */

const Util = require('../util/layout')
const Layout = {}

/**
 * 註冊佈局的方法
 * @param {string} type 佈局類型，外部引用指定必須，不要與已有佈局類型重名
 * @param {object} layout 佈局方法
 */
Layout.registerLayout = function(type, layout) {
  if (!layout) {
    throw new Error('please specify handler for this layout:' + type)
  }
  const base = function(cfg) {
    const self = this
    Util.mix(self, self.getDefaultCfg(), cfg)
  }
  Util.augment(base, {
    /**
     * 初始化
     * @param {object} data 數據
     */
    init(data) {
      const self = this
      self.nodes = data.nodes
      self.edges = data.edges
    },
    /**
     * 執行佈局
     */
    execute() {
    },
    /**
     * 根據傳入的數據進行佈局
     * @param {object} data 數據
     */
    layout(data) {
      const self = this
      self.init(data)
      self.execute()
    },
    /**
     * 更新佈局配置，但不執行佈局
     * @param {object} cfg 需要更新的配置項
     */
    updateCfg(cfg) {
      const self = this
      Util.mix(self, cfg)
    },
    /**
     * 銷毀
     */
    destroy() {
      const self = this
      self.positions = null
      self.nodes = null
      self.edges = null
      self.destroyed = true
    },
    /**
     * 定義自定義行為的默認參數，會與用戶傳入的參數進行合並
     */
    getDefaultCfg() {}
  }, layout)
  Layout[type] = base
}

module.exports = Layout
