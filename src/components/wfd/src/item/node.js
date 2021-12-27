/**
 * @fileOverview node item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/')
const Item = require('./item')
const CACHE_ANCHOR_POINTS = 'anchorPointsCache'
const CACHE_BBOX = 'bboxCache'

function getNearestPoint(points, curPoint) {
  let index = 0
  let nearestPoint = points[0]
  let minDistance = pointDistance(points[0], curPoint)
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    const distance = pointDistance(point, curPoint)
    if (distance < minDistance) {
      nearestPoint = point
      minDistance = distance
      index = i
    }
  }
  nearestPoint.anchorIndex = index
  return nearestPoint
}

function pointDistance(p1, p2) {
  return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y)
}

class Node extends Item {
  getDefaultCfg() {
    return {
      type: 'node',
      anchors: [],
      edges: [],
      status: []
    }
  }

  // getNeighbors() {
  //   const nodes = [];
  //   let node = null;
  //   Util.each(this.get('edges'), edge => {
  //     if (edge.get('source') === this) {
  //       node = edge.get('target');
  //     } else {
  //       node = edge.get('source');
  //     }
  //     if (nodes.indexOf(node) < 0) {
  //       nodes.push(node);
  //     }
  //   });
  //   return nodes;
  // }

  /**
   * 獲取從節點關聯的所有邊
   * @return {Array} 邊的集合
   */
  getEdges() {
    return this.get('edges')
  }
  /**
   * 獲取引入節點的邊 target == this
   * @return {Array} 邊的集合
   */
  getInEdges() {
    const self = this
    return this.get('edges').filter(edge => {
      return edge.get('target') === self
    })
  }
  /**
   * 獲取從節點引出的邊 source == this
   * @return {Array} 邊的集合
   */
  getOutEdges() {
    const self = this
    return this.get('edges').filter(edge => {
      return edge.get('source') === self
    })
  }

  // showAnchors() {
  //   // todo
  // }
  // hideAnchors() {

  // }
  /**
   * 根據錨點的索引獲取連接點
   * @param  {Number} index 索引
   * @return {Object} 連接點 {x,y}
   */
  getLinkPointByAnchor(index) {
    const anchorPoints = this.getAnchorPoints()
    return anchorPoints[index]
  }

  /**
    * 獲取連接點
    * @param {Object} point 節點外面的一個點，用於計算交點、最近的錨點
    * @return {Object} 連接點 {x,y}
    */
  getLinkPoint(point) {
    // const model = this.get('model');
    const keyShape = this.get('keyShape')
    const type = keyShape.get('type')
    const bbox = this.getBBox()
    const { centerX, centerY } = bbox
    const anchorPoints = this.getAnchorPoints()
    let intersectPoint
    switch (type) {
      case 'circle':
        intersectPoint = Util.getCircleIntersectByPoint({
          x: centerX,
          y: centerY,
          r: bbox.width / 2
        }, point)
        break
      case 'ellipse':
        intersectPoint = Util.getEllispeIntersectByPoint({
          x: centerX,
          y: centerY,
          rx: bbox.width / 2,
          ry: bbox.height / 2
        }, point)
        break
      default:
        intersectPoint = Util.getRectIntersectByPoint(bbox, point)
    }
    let linkPoint = intersectPoint
    // 如果存在錨點，則使用交點計算最近的錨點
    if (anchorPoints.length) {
      if (!linkPoint) { // 如果計算不出交點
        linkPoint = point
      }
      linkPoint = getNearestPoint(anchorPoints, linkPoint)
    }
    if (!linkPoint) { // 如果最終依然沒法找到錨點和連接點，直接返回中心點
      linkPoint = { x: centerX, y: centerY }
    }
    return linkPoint
  }

  /**
   * 鎖定節點
   */
  lock() {
    this.set('locked', true)
  }

  /**
   * 解鎖鎖定的節點
   */
  unlock() {
    this.set('locked', false)
  }

  hasLocked() {
    return this.get('locked')
  }

  /**
   * 添加邊
   * @param {Edge} edge 邊
   */
  addEdge(edge) {
    this.get('edges').push(edge)
  }

  /**
   * 移除邊
   * @param {Edge} edge 邊
   */
  removeEdge(edge) {
    const edges = this.getEdges()
    const index = edges.indexOf(edge)
    if (index > -1) {
      edges.splice(index, 1)
    }
  }

  clearCache() {
    this.set(CACHE_BBOX, null) // 清理緩存的 bbox
    this.set(CACHE_ANCHOR_POINTS, null)
  }

  // 是否僅僅移動節點，其他屬性沒變化
  _isOnlyMove(cfg) {
    if (!cfg) {
      return false // 刷新時不僅僅移動
    }
    // 不能直接使用 cfg.x && cfg.y 這類的判定，因為 0 的情況會出現
    const existX = !Util.isNil(cfg.x)
    const existY = !Util.isNil(cfg.y)
    const keys = Object.keys(cfg)
    return (keys.length === 1 && (existX || existY)) || // 僅有一個字段，包含 x 或者 包含 y
      (keys.length === 2 && existX && existY) // 兩個字段，同時有 x，同時有 y
  }

  /**
   * 獲取錨點的定義
   * @return {array} anchorPoints， {x,y,...cfg}
   */
  getAnchorPoints() {
    let anchorPoints = this.get(CACHE_ANCHOR_POINTS)
    if (!anchorPoints) {
      anchorPoints = []
      const shapeFactory = this.get('shapeFactory')
      const bbox = this.getBBox()
      const model = this.get('model')
      const shapeCfg = this.getShapeCfg(model)
      const points = shapeFactory.getAnchorPoints(model.shape, shapeCfg) || []
      Util.each(points, (pointArr, index) => {
        const point = Util.mix({
          x: bbox.minX + pointArr[0] * bbox.width,
          y: bbox.minY + pointArr[1] * bbox.height
        }, pointArr[2], {
          index
        })
        anchorPoints.push(point)
      })
      this.set(CACHE_ANCHOR_POINTS, anchorPoints)
    }
    return anchorPoints
  }
}
module.exports = Node
