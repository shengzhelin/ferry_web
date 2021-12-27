/**
 * @fileOverview edge item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/')
const Item = require('./item')
const END_MAP = { source: 'start', target: 'end' }
const ITEM_NAME_SUFFIX = 'Node' // 端點的後綴，如 sourceNode, targetNode
const POINT_NAME_SUFFIX = 'Point' // 起點或者結束點的後綴，如 startPoint, endPoint
const ANCHOR_NAME_SUFFIX = 'Anchor'

class Edge extends Item {
  getDefaultCfg() {
    return {
      type: 'edge',
      sourceNode: null,
      targetNode: null,
      startPoint: null,
      endPoint: null,
      linkCenter: false // 參數名暫時沒想好，是連接節點的中心，還是直接連接 x,y
    }
  }

  init() {
    super.init()
    // 初始化兩個端點
    this.setSource(this.get('source'))
    this.setTarget(this.get('target'))
  }

  setSource(source) {
    this._setEnd('source', source)
    this.set('source', source)
  }

  setTarget(target) {
    this._setEnd('target', target)
    this.set('target', target)
  }

  getSource() {
    return this.get('source')
  }

  getTarget() {
    return this.get('target')
  }

  /**
   * 邊不需要重計算容器位置，直接重新計算 path 位置
   * @param {object} cfg 待更新數據
   */
  update(cfg) {
    const model = this.get('model')
    Util.mix(model, cfg)
    this.updateShape()
    this.afterUpdate()
    this.clearCache()
  }

  updatePosition() {}

  // 設置端點：起點或者結束點
  _setEnd(name, value) {
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX
    const itemName = name + ITEM_NAME_SUFFIX
    const preItem = this.get(itemName)
    preItem && preItem.removeEdge(this) // 如果之前存在節點，則移除掉邊
    if (Util.isPlainObject(value)) { // 如果設置成具體的點，則清理節點
      this.set(pointName, value)
      this.set(itemName, null)
    } else {
      value.addEdge(this)
      this.set(itemName, value)
      this.set(pointName, null)
    }
  }

  // 獲取與端點相交的節點
  _getLinkPoint(name, model, controlPoints) {
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX
    const itemName = name + ITEM_NAME_SUFFIX
    let point = this.get(pointName)
    if (!point) {
      const item = this.get(itemName)
      const anchorName = name + ANCHOR_NAME_SUFFIX
      const prePoint = this._getPrePoint(name, controlPoints)
      const anchorIndex = model[anchorName]
      if (!Util.isNil(anchorIndex)) { // 如果有錨點，則使用錨點索引獲取連接點
        point = item.getLinkPointByAnchor(anchorIndex)
      }
      // 如果錨點沒有對應的點或者沒有錨點，則直接計算連接點
      point = point || item.getLinkPoint(prePoint)
      if (!Util.isNil(point.index)) {
        this.set(name + 'AnchorIndex', point.index)
      }
    }
    return point
  }

  // 獲取同端點進行連接的點，計算交匯點
  _getPrePoint(name, controlPoints) {
    if (controlPoints && controlPoints.length) {
      const index = name === 'source' ? 0 : controlPoints.length - 1
      return controlPoints[index]
    }
    const oppositeName = name === 'source' ? 'target' : 'source' // 取另一個節點的位置
    return this._getEndPoint(oppositeName)
  }

  // 通過端點的中心獲取控制點
  _getControlPointsByCenter(model) {
    const sourcePoint = this._getEndPoint('source')
    const targetPoint = this._getEndPoint('target')
    const shapeFactory = this.get('shapeFactory')
    return shapeFactory.getControlPoints(model.shape, {
      startPoint: sourcePoint,
      endPoint: targetPoint
    })
  }

  // 獲取端點的位置
  _getEndPoint(name) {
    const itemName = name + ITEM_NAME_SUFFIX
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX
    const item = this.get(itemName)
    // 如果有端點，直接使用 model
    if (item) {
      return item.get('model')
    } // 否則直接使用點
    return this.get(pointName)
  }

  _getEndCenter(name) {
    const itemName = name + ITEM_NAME_SUFFIX
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX
    const item = this.get(itemName)
    // 如果有端點，直接使用 model
    if (item) {
      const bbox = item.getBBox()
      return {
        x: bbox.centerX,
        y: bbox.centerY
      }
    } // 否則直接使用點
    return this.get(pointName)
  }

  getShapeCfg(model) {
    const self = this
    const linkCenter = self.get('linkCenter') // 如果連接到中心，忽視錨點、忽視控制點
    const cfg = super.getShapeCfg(model)
    if (linkCenter) {
      cfg.startPoint = self._getEndCenter('source')
      cfg.endPoint = self._getEndCenter('target')
    } else {
      const controlPoints = cfg.controlPoints || self._getControlPointsByCenter(cfg)
      cfg.startPoint = self._getLinkPoint('source', model, controlPoints)
      cfg.endPoint = self._getLinkPoint('target', model, controlPoints)
    }
    cfg.sourceNode = self.get('sourceNode')
    cfg.targetNode = self.get('targetNode')
    return cfg
  }

  getModel() {
    const model = this.get('model')
    const out = Util.mix({}, model)
    const sourceItem = this.get('source' + ITEM_NAME_SUFFIX)
    const targetItem = this.get('target' + ITEM_NAME_SUFFIX)
    if (sourceItem) {
      out.source = sourceItem.get('id')
      delete out['source' + ITEM_NAME_SUFFIX]
    } else {
      out.source = this.get('start' + POINT_NAME_SUFFIX)
    }
    if (targetItem) {
      out.target = targetItem.get('id')
      delete out['target' + ITEM_NAME_SUFFIX]
    } else {
      out.target = this.get('end' + POINT_NAME_SUFFIX)
    }
    return out
  }

  destroy() {
    const sourceItem = this.get('source' + ITEM_NAME_SUFFIX)
    const targetItem = this.get('target' + ITEM_NAME_SUFFIX)
    sourceItem && !sourceItem.destroyed && sourceItem.removeEdge(this)
    targetItem && !targetItem.destroyed && targetItem.removeEdge(this)
    super.destroy()
  }
}

module.exports = Edge
