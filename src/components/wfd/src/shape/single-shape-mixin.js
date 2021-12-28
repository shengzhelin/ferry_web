/**
 * @fileOverview 自定義節點和邊的過程中，發現大量重覆代碼
 * @author dxq613@gmail.com
 */
const Global = require('../global')
const Util = require('../util/index')
const { get, cloneDeep, merge } = require('lodash')

const CLS_SHAPE_SUFFIX = '-shape'
const CLS_LABEL_SUFFIX = '-label'

// 單個 shape 帶有一個 label，共用這段代碼
const SingleShape = {
  // 默認樣式及配置
  options: {},
  /**
	 * 用戶自定義節點或邊的樣式，初始渲染時使用
	 * @override
	 * @param  {Object} model 節點的配置項
	 */
  getCustomConfig(/* model */) {},
  itemType: '', // node, edge, group, anchor 等
  /**
	 * 繪制節點/邊，包含文本
	 * @override
	 * @param  {Object} cfg 節點的配置項
	 * @param  {G.Group} group 節點的容器
	 * @return {G.Shape} 繪制的圖形
	 */
  draw(cfg, group) {
    const shape = this.drawShape(cfg, group)
    shape.set('className', this.itemType + CLS_SHAPE_SUFFIX)
    if (cfg.label) {
      const label = this.drawLabel(cfg, group)
      label.set('className', this.itemType + CLS_LABEL_SUFFIX)
    }
    return shape
  },
  drawShape(/* cfg, group */) {

  },
  drawLabel(cfg, group) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { labelCfg: defaultLabelCfg } = this.options
    const { labelCfg: customLabelCfg } = customOptions

    const labelCfg = merge({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg)
    const labelStyle = this.getLabelStyle(cfg, labelCfg, group)
    const label = group.addShape('text', {
      attrs: labelStyle
    })
    return label
  },
  getLabelStyleByPosition(/* cfg, labelCfg, group */) {

  },
  /**
	 * 獲取文本的配置項
	 * @internal 用戶創建和更新節點/邊時，同時會更新文本
	 * @param  {Object} cfg 節點的配置項
     * @param {Object} labelCfg 文本的配置項
	 * @param {G.Group} group 父容器，label 的定位可能與圖形相關
	 * @return {Object} 圖形的配置項
	 */
  getLabelStyle(cfg, labelCfg, group) {
    const calculateStyle = this.getLabelStyleByPosition(cfg, labelCfg, group)
    calculateStyle.text = cfg.label
    const attrName = this.itemType + 'Label' // 取 nodeLabel，edgeLabel 的配置項
    const defaultStyle = Global[attrName] ? Global[attrName].style : null
    const labelStyle = Util.mix({}, defaultStyle, calculateStyle, labelCfg.style)
    return labelStyle
  },
  /**
	 * 獲取圖形的配置項
	 * @internal 僅在定義這一類節點使用，用戶創建和更新節點
	 * @param  {Object} cfg 節點的配置項
	 * @return {Object} 圖形的配置項
	 */
  getShapeStyle(cfg) {
    return cfg.style
  },
  /**
	 * 更新節點，包含文本
	 * @override
	 * @param  {Object} cfg 節點/邊的配置項
	 * @param  {G6.Item} item 節點/邊
	 */
  update(cfg, item) {
    const group = item.getContainer()
    const shapeClassName = this.itemType + CLS_SHAPE_SUFFIX
    const shape = group.findByClassName(shapeClassName)
    const shapeStyle = this.getShapeStyle(cfg)
    shape && shape.attr(shapeStyle)
    const labelClassName = this.itemType + CLS_LABEL_SUFFIX
    const label = group.findByClassName(labelClassName)
    // 此時需要考慮之前是否繪制了 label 的場景存在三種情況
    // 1. 更新時不需要 label，但是原先存在 label，此時需要刪除
    // 2. 更新時需要 label, 但是原先不存在，創建節點
    // 3. 如果兩者都存在，更新
    if (!cfg.label) {
      label && label.remove()
    } else {
      if (!label) {
        const newLabel = this.drawLabel(cfg, group)
        newLabel.set('className', labelClassName)
      } else {
        const labelCfg = cfg.labelCfg || {}
        const labelStyle = this.getLabelStyle(cfg, labelCfg, group)
        /**
         * fixme g中shape的rotate是角度累加的，不是label的rotate想要的角度
         * 由於現在label只有rotate操作，所以在更新label的時候如果style中有rotate就重置一下變換
         * 後續會基於g的Text覆寫一個Label出來處理這一類問題
         */
        label.resetMatrix()
        label.attr(labelStyle)
      }
    }
  },

  /**
	 * 設置節點的狀態，主要是交互狀態，業務狀態請在 draw 方法中實現
	 * 單圖形的節點僅考慮 selected、active 狀態，有其他狀態需求的用戶自己覆寫這個方法
	 * @override
	 * @param  {String} name 狀態名稱
	 * @param  {Object} value 狀態值
	 * @param  {G6.Item} item 節點
	 */
  setState(name, value, item) {
    const shape = item.get('keyShape')
    if (!shape) {
      return
    }
    const itemStateStyle = item.getStateStyle(name)
    const stateStyle = this.getStateStyle(name, value, item)
    const styles = merge({}, stateStyle, itemStateStyle)
    if (value) { // 如果設置狀態,在原本狀態上疊加繪圖屬性
      shape.attr(styles)
    } else { // 取消狀態時重置所有狀態，依次疊加仍有的狀態
      const style = item.getCurrentStatesStyle()
      // 如果默認狀態下沒有設置attr，在某狀態下設置了，需要重置到沒有設置的狀態
      Util.each(styles, (val, attr) => {
        if (!style[attr]) {
          style[attr] = null
        }
      })
      shape.attr(style)
    }
  },
  /**
   * 獲取不同狀態下的樣式
   *
   * @param {string} name 狀態名稱
   * @param {boolean} value 是否啟用該狀態
   * @param {Item} item Node或Edge的實例
   * @return {object} 樣式
   */
  getStateStyle(name, value, item) {
    const model = item.getModel()
    const customOptions = this.getCustomConfig(model) || {}
    const { style: defaultStyle, stateStyles: defaultStateStyle } = this.options
    const { style: customStyle, stateStyles: customStateStyle } = customOptions

    const stateStyles = merge({}, defaultStateStyle, customStateStyle)
    let currentStateStyle = defaultStyle

    if (stateStyles[name]) {
      currentStateStyle = stateStyles[name]
    }
    if (value) {
      return merge({}, currentStateStyle, model.style)
    }

    const states = item.getStates()
    const resultStyle = merge({}, defaultStyle, customStyle)
    const style = cloneDeep(resultStyle)
    states.forEach(state => {
      merge(style, get(defaultStyle, state, {}), get(customStyle, state, {}), model.style)
    })
    return style
  }
}

module.exports = SingleShape
