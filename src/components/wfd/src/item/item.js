/**
 * @fileOverview item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/')
const Shape = require('../shape')
const Global = require('../global')
const CACHE_BBOX = 'bboxCache'
const GLOBAL_STATE_STYLE_SUFFIX = 'StateStyle'
const NAME_STYLE = 'Style' // cache 緩存的狀態屬性的名字
const RESERVED_STYLES = ['fillStyle', 'strokeStyle', 'path', 'points', 'img', 'symbol']

class Item {
  constructor(cfg) {
    const defaultCfg = {
      /**
       * id
       * @type {string}
       */
      id: null,

      /**
       * 類型
       * @type {string}
       */
      type: 'item',

      /**
       * data model
       * @type {object}
       */
      model: {},

      /**
       * g group
       * @type {G.Group}
       */
      group: null,

      /**
       * is open animate
       * @type {boolean}
       */
      animate: false,

      /**
       * visible - not group visible
       * @type {boolean}
       */
      visible: true,

      /**
       * locked - lock node
       * @type {boolean}
       */
      locked: false,
      /**
       * capture event
       * @type {boolean}
       */
      event: true,
      /**
       * key shape to calculate item's bbox
       * @type object
       */
      keyShape: null,
      /**
       * item's states, such as selected or active
       * @type Array
       */
      states: []
    }
    this._cfg = Util.mix(defaultCfg, this.getDefaultCfg(), cfg)
    const group = cfg.group
    group.set('item', this)
    let id = this.get('model').id
    if (!id || id === '') {
      id = Util.uniqueId(this.get('type'))
    }
    this.set('id', id)
    group.set('id', id)
    this.init()
    this.draw()
  }

  /**
   * 是否是 Item 對象，懸空邊情況下進行判定
   * @return {Boolean} 是否是 Item 對象
   */
  isItem() {
    return true
  }

  /**
   * 獲取屬性
   * @internal 僅內部類使用
   * @param  {String} key 屬性名
   * @return {*} 屬性值
   */
  get(key) {
    return this._cfg[key]
  }

  /**
   * 設置屬性
   * @internal 僅內部類使用
   * @param {String|Object} key 屬性名，也可以是對象
   * @param {*} val 屬性值
   */
  set(key, val) {
    if (Util.isPlainObject(key)) {
      this._cfg = Util.mix({}, this._cfg, key)
    } else {
      this._cfg[key] = val
    }
  }
  /**
   * 獲取默認的配置項
   * @protected 供子類覆寫
   * @return {Object} 配置項
   */
  getDefaultCfg() {
    return {}
  }
  /**
   * 初始化
   * @protected
   */
  init() {
    const shapeFactory = Shape.getFactory(this.get('type'))
    this.set('shapeFactory', shapeFactory)
  }
  // 根據 keyshape 計算包圍盒
  _calculateBBox() {
    const keyShape = this.get('keyShape')
    const group = this.get('group')
    // 因為 group 可能會移動，所以必須通過父元素計算才能計算出正確的包圍盒
    const bbox = Util.getBBox(keyShape, group)
    bbox.x = bbox.minX
    bbox.y = bbox.minY
    bbox.width = bbox.maxX - bbox.minX
    bbox.height = bbox.maxY - bbox.minY
    bbox.centerX = (bbox.minX + bbox.maxX) / 2
    bbox.centerY = (bbox.minY + bbox.maxY) / 2
    return bbox
  }

  // 繪制
  _drawInner() {
    const self = this
    const shapeFactory = self.get('shapeFactory')
    const group = self.get('group')
    const model = self.get('model')
    group.clear()

    if (!shapeFactory) {
      return
    }
    self.updatePosition(model)
    const cfg = self.getShapeCfg(model) // 可能會附加額外信息
    const shapeType = cfg.shape
    const keyShape = shapeFactory.draw(shapeType, cfg, group)
    if (keyShape) {
      keyShape.isKeyShape = true
      self.set('keyShape', keyShape)
      self.set('originStyle', this.getKeyShapeStyle())
    }
    // 防止由於用戶外部修改 model 中的 shape 導致 shape 不更新
    this.set('currentShape', shapeType)
    this._resetStates(shapeFactory, shapeType)
  }

  getKeyShapeStyle() {
    const keyShape = this.getKeyShape()
    if (keyShape) {
      const styles = {}
      Util.each(keyShape.attr(), (val, key) => {
        if (RESERVED_STYLES.indexOf(key) < 0) {
          styles[key] = val
        }
      })
      return styles
    }
  }

  _resetStates(shapeFactory, shapeType) {
    const self = this
    const states = self.get('states')
    Util.each(states, state => {
      shapeFactory.setState(shapeType, state, true, self)
    })
  }

  /**
   * 獲取當前元素的所有狀態
   * @return {Array} 元素的所有狀態
   */
  getStates() {
    return this.get('states')
  }

  /**
   * 當前元素是否處於某狀態
   * @param {String} state 狀態名
   * @return {Boolean} 是否處於某狀態
   */
  hasState(state) {
    return this.get('states').indexOf(state) >= 0
  }

  getStateStyle(state) {
    const self = this
    // Global.nodeStateStyle
    const globalStyle = Global[self.getType() + GLOBAL_STATE_STYLE_SUFFIX][state]
    const styles = this.get('styles')
    const defaultStyle = styles && styles[state]
    // 狀態名 + style（activeStyle) 存儲在 item 中，如果 item 中不存在這些信息，則使用默認的樣式
    const fieldName = state + NAME_STYLE
    return Util.mix({}, globalStyle, defaultStyle, self.get(fieldName))
  }

  getOriginStyle() {
    return this.get('originStyle')
  }

  getCurrentStatesStyle() {
    const self = this
    const originStyle = Util.mix({}, self.getOriginStyle())
    Util.each(self.getStates(), state => {
      Util.mix(originStyle, self.getStateStyle(state))
    })
    return originStyle
  }

  /**
   * 更改元素狀態， visible 不屬於這個範疇
   * @internal 僅提供內部類 graph 使用
   * @param {String} state 狀態名
   * @param {Boolean} enable 節點狀態值
   */
  setState(state, enable) {
    const states = this.get('states')
    const shapeFactory = this.get('shapeFactory')
    const index = states.indexOf(state)
    if (enable) {
      if (index > -1) {
        return
      }
      states.push(state)
    } else if (index > -1) {
      states.splice(index, 1)
    }
    if (shapeFactory) {
      const model = this.get('model')
      shapeFactory.setState(model.shape, state, enable, this)
    }
  }

  clearStates(states) {
    const self = this
    const originStates = self.getStates()
    const shapeFactory = self.get('shapeFactory')
    const shape = self.get('model').shape
    if (!states) {
      self.set('states', [])
      shapeFactory.setState(shape, originStates[0], false, self)
      return
    }
    if (Util.isString(states)) {
      states = [states]
    }
    const newStates = originStates.filter(state => {
      shapeFactory.setState(shape, state, false, self)
      if (states.indexOf(state) >= 0) {
        return false
      }
      return true
    })
    self.set('states', newStates)
  }

  /**
   * 節點的圖形容器
   * @return {G.Group} 圖形容器
   */
  getContainer() {
    return this.get('group')
  }

  /**
   * 節點的關鍵形狀，用於計算節點大小，連線截距等
   * @return {G.Shape} 關鍵形狀
   */
  getKeyShape() {
    return this.get('keyShape')
  }

  /**
   * 節點數據模型
   * @return {Object} 數據模型
   */
  getModel() {
    return this.get('model')
  }

  /**
   * 節點類型
   * @return {string} 節點的類型
   */
  getType() {
    return this.get('type')
  }

  /**
   * 渲染前的邏輯，提供給子類覆寫
   * @protected
   */
  beforeDraw() {

  }
  /**
   * 渲染後的邏輯，提供給子類覆寫
   * @protected
   */
  afterDraw() {

  }

  getShapeCfg(model) {
    const styles = this.get('styles')
    if (styles && styles.default) {
      // merge graph的item樣式與數據模型中的樣式
      const newModel = Util.mix({}, model)
      newModel.style = Util.mix({}, styles.default, model.style)
      return newModel
    }
    return model
  }

  /**
   * 刷新一般用於處理幾種情況
   * 1. item model 在外部被改變
   * 2. 邊的節點位置發生改變，需要重新計算邊
   *
   * 因為數據從外部被修改無法判斷一些屬性是否被修改，直接走位置和 shape 的更新
   */
  refresh() {
    const model = this.get('model')
    // 更新元素位置
    this.updatePosition(model)
    // 更新元素內容，樣式
    this.updateShape()
    // 做一些更新之後的操作
    this.afterUpdate()
    // 清除緩存
    this.clearCache()
  }

  /**
   * 將更新應用到 model 上，刷新屬性
   * @internal 僅提供給 Graph 使用，外部直接調用 graph.update 接口
   * @param  {Object} cfg       配置項，可以是增量信息
   */
  update(cfg) {
    const model = this.get('model')
    const originPosition = { x: model.x, y: model.y }
    // 直接將更新合到原數據模型上，可以保證用戶在外部修改源數據然後刷新時的樣式符合期待。
    Util.mix(model, cfg)
    const onlyMove = this._isOnlyMove(cfg)
    // 僅僅移動位置時，既不更新，也不重繪
    if (onlyMove) {
      this.updatePosition(model)
    } else {
      // 如果 x,y 有變化，先重置位置
      if (originPosition.x !== model.x || originPosition.y !== model.y) {
        this.updatePosition(model)
      }
      this.updateShape()
    }
    this.afterUpdate()
    this.clearCache()
  }

  /**
   * 更新元素內容，樣式
   */
  updateShape() {
    const shapeFactory = this.get('shapeFactory')
    const model = this.get('model')
    const shape = model.shape
    // 判定是否允許更新
    // 1. 注冊的節點允許更新
    // 2. 更新後的 shape 等於原先的 shape
    if (shapeFactory.shouldUpdate(shape) && shape === this.get('currentShape')) {
      const updateCfg = this.getShapeCfg(model)
      shapeFactory.update(shape, updateCfg, this)
    } else {
      // 如果不滿足上面兩種狀態，重新繪制
      this.draw()
    }
    this.set('originStyle', this.getKeyShapeStyle())
    // 更新後重置節點狀態
    this._resetStates(shapeFactory, shape)
  }

  /**
   * 更新位置，避免整體重繪
   * @param {object} cfg 待更新數據
   */
  updatePosition(cfg) {
    const model = this.get('model')

    const x = Util.isNil(cfg.x) ? model.x : cfg.x
    const y = Util.isNil(cfg.y) ? model.y : cfg.y

    const group = this.get('group')
    if (Util.isNil(x) || Util.isNil(y)) {
      return
    }
    group.resetMatrix()
    group.translate(x, y)
    model.x = x
    model.y = y
    this.clearCache() // 位置更新後需要清除緩存
  }

  /**
   * 更新後做一些工作
   * @protected
   */
  afterUpdate() {

  }

  /**
   * 更新/刷新等操作後，清除 cache
   */
  clearCache() {
    this.set(CACHE_BBOX, null)
  }

  /**
   * 繪制元素
   */
  draw() {
    this.beforeDraw()
    this._drawInner()
    this.afterDraw()
  }

  /**
   * 獲取元素的包圍盒
   * @return {Object} 包含 x,y,width,height, centerX, centerY
   */
  getBBox() {
    let bbox = this.get(CACHE_BBOX)
    if (!bbox) { // 計算 bbox 開銷有些大，緩存
      bbox = this._calculateBBox()
      this.set(CACHE_BBOX, bbox)
    }
    return bbox
  }

  /**
   * 將元素放到最前面
   */
  toFront() {
    this.get('group').toFront()
  }

  /**
   * 將元素放到最後面
   */
  toBack() {
    this.get('group').toBack()
  }

  /**
   * 顯示元素
   */
  show() {
    this.changeVisibility(true)
  }

  /**
   * 隱藏元素
   */
  hide() {
    this.changeVisibility(false)
  }

  /**
   * 更改是否顯示
   * @param  {Boolean} visible 是否顯示
   */
  changeVisibility(visible) {
    const group = this.get('group')
    if (visible) {
      group.show()
    } else {
      group.hide()
    }
    this.set('visible', visible)
  }

  /**
   * 是否拾取及出發該元素的交互事件
   * @param {Boolean} enable 標識位
   */
  enableCapture(enable) {
    const group = this.get('group')
    group && group.attr('capture', enable)
  }

  isVisible() {
    return this.get('visible')
  }
  /**
   * 析構函數
   */
  destroy() {
    if (!this.destroyed) {
      const animate = this.get('animate')
      const group = this.get('group')
      if (animate) {
        group.stopAnimate()
      }
      group.remove()
      this._cfg = null
      this.destroyed = true
    }
  }
}

module.exports = Item
