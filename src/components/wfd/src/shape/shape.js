/**
 * @fileOverview 自定義 Shape 的基類
 * @author dxq613@gmail.com
 */

const Util = require('../util/')
require('./extend/group')
const Shape = {}
const cache = {} // ucfirst 開銷過大，進行緩存
// 首字母大寫
function ucfirst(str) {
  return cache[str] || Util.upperFirst(str)
}

/**
 * 工廠方法的基類
 * @type Shape.FactoryBase
 */
const ShapeFactoryBase = {
  /**
   * 默認的形狀，當沒有指定/匹配 shapeType 時，使用默認的
   * @type {String}
   */
  defaultShapeType: null,
  /**
   * 獲取繪制 Shape 的工具類，無狀態
   * @param  {String} type 類型
   * @return {Object} 工具類
   */
  getShape(type) {
    const self = this
    const shape = self[type] || self[self.defaultShapeType]
    return shape
  },
  /**
   * 繪制圖形
   * @param  {String} type  類型
   * @param  {Object} cfg 配置項
   * @param  {G.Group} group 圖形的分組
   * @return {G.Shape} 圖形對象
   */
  draw(type, cfg, group) {
    const shape = this.getShape(type)
    const rst = shape.draw(cfg, group)
    shape.afterDraw(cfg, group, rst)
    return rst
  },
  /**
   * 更新
   * @param  {String} type  類型
   * @param  {Object} cfg 配置項
   * @param  {G6.Item} item 節點、邊、分組等
   */
  update(type, cfg, item) {
    const shape = this.getShape(type)
    if (shape.update) { // 防止沒定義 update 函數
      shape.update(cfg, item)
      shape.afterUpdate(cfg, item)
    }
  },
  /**
   * 設置狀態
   * @param {String} type  類型
   * @param {String} name  狀態名
   * @param {String} value 狀態值
   * @param {G6.Item} item  節點、邊、分組等
   */
  setState(type, name, value, item) {
    const shape = this.getShape(type)
    shape.setState(name, value, item)
  },
  /**
   * 是否允許更新，不重新繪制圖形
   * @param  {String} type 類型
   * @return {Boolean} 是否允許使用更新
   */
  shouldUpdate(type) {
    const shape = this.getShape(type)
    return !!shape.update
  },
  getControlPoints(type, cfg) {
    const shape = this.getShape(type)
    return shape.getControlPoints(cfg)
  },
  /**
   * 獲取控制點
   * @param {String} type 節點、邊類型
   * @param  {Object} cfg 節點、邊的配置項
   * @return {Array|null} 控制點的數組,如果為 null，則沒有控制點
   */
  getAnchorPoints(type, cfg) {
    const shape = this.getShape(type)
    return shape.getAnchorPoints(cfg)
  }
}

/**
 * 繪制元素的工具類基類
 * @class Shape.ShapeBase
 */
const ShapeBase = {
  // 默認樣式及配置
  options: {},
  /**
	 * 用戶自定義節點或邊的樣式，初始渲染時使用
	 * @override
	 * @param  {Object} model 節點的配置項
	 */
  getCustomConfig(/* model */) {},
  /**
   * 繪制
   */
  draw(/* cfg, group */) {

  },
  /**
   * 繪制完成後的操作，便於用戶繼承現有的節點、邊
   */
  afterDraw(/* cfg, group */) {

  },
  // update(cfg, item) // 默認不定義
  afterUpdate(/* cfg, item */) {

  },
  /**
   * 設置節點、邊狀態
   */
  setState(/* name, value, item */) {

  },
  /**
   * 獲取控制點
   * @param  {Object} cfg 節點、邊的配置項
   * @return {Array|null} 控制點的數組,如果為 null，則沒有控制點
   */
  getControlPoints(cfg) {
    return cfg.controlPoints
  },
  /**
   * 獲取控制點
   * @param  {Object} cfg 節點、邊的配置項
   * @return {Array|null} 控制點的數組,如果為 null，則沒有控制點
   */
  getAnchorPoints(cfg) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { anchorPoints: defaultAnchorPoints } = this.options
    const { anchorPoints: customAnchorPoints } = customOptions
    const anchorPoints = cfg.anchorPoints || customAnchorPoints || defaultAnchorPoints
    return anchorPoints
  }
  /* 如果沒定義 update 方法，每次都調用 draw 方法
  update(cfg, item) {

  }
  */
}

// 注冊 Geometry 獲取圖形的入口
Shape.registerFactory = function(factoryType, cfg) {
  const className = ucfirst(factoryType)
  const shapeFactory = Util.mix({}, ShapeFactoryBase, cfg)
  Shape[className] = shapeFactory
  shapeFactory.className = className
  addRegister(shapeFactory)
  return shapeFactory
}

// 統一 registerNode, registerEdge, registerGuide 的實現
function addRegister(shapeFactory) {
  const functionName = 'register' + shapeFactory.className
  Shape[functionName] = function(shapeType, cfg, extendShapeType) {
    const extendShape = extendShapeType ? shapeFactory.getShape(extendShapeType) : ShapeBase
    const shapeObj = Util.mix({}, extendShape, cfg)
    shapeObj.type = shapeType
    shapeFactory[shapeType] = shapeObj
    return shapeObj
  }
}

// 獲得 ShapeFactory
Shape.getFactory = function(factoryType) {
  const self = this
  factoryType = ucfirst(factoryType)
  return self[factoryType]
}

module.exports = Shape
