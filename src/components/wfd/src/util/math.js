/**
 * @fileOverview math util
 * @author huangtonger@aliyun.com
 */

const BaseUtil = require('./base')
const tolerance = 0.001
const MathUtil = {
  /**
   * 是否在區間內
   * @param   {number}       value  值
   * @param   {number}       min    最小值
   * @param   {number}       max    最大值
   * @return  {boolean}      bool   布爾
   */
  isBetween(value, min, max) {
    return value >= min && value <= max
  },
  /**
   * 兩線段交點
   * @param  {object}  p0 第一條線段起點
   * @param  {object}  p1 第一條線段終點
   * @param  {object}  p2 第二條線段起點
   * @param  {object}  p3 第二條線段終點
   * @return {object}  交點
   */
  getLineIntersect(p0, p1, p2, p3) {
    const E = {
      x: p2.x - p0.x,
      y: p2.y - p0.y
    }
    const D0 = {
      x: p1.x - p0.x,
      y: p1.y - p0.y
    }
    const D1 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y
    }
    const kross = D0.x * D1.y - D0.y * D1.x
    const sqrKross = kross * kross
    const sqrLen0 = D0.x * D0.x + D0.y * D0.y
    const sqrLen1 = D1.x * D1.x + D1.y * D1.y
    let point = null
    if (sqrKross > tolerance * sqrLen0 * sqrLen1) {
      const s = (E.x * D1.y - E.y * D1.x) / kross
      const t = (E.x * D0.y - E.y * D0.x) / kross
      if (MathUtil.isBetween(s, 0, 1) && MathUtil.isBetween(t, 0, 1)) {
        point = {
          x: p0.x + s * D0.x,
          y: p0.y + s * D0.y
        }
      }
    }
    return point
  },
  /**
   * point and rectangular intersection point
   * @param  {object} rect  rect
   * @param  {object} point point
   * @return {object} rst;
   */
  getRectIntersectByPoint(rect, point) {
    const { x, y, width, height } = rect
    const cx = x + width / 2
    const cy = y + height / 2
    const points = []
    const center = {
      x: cx,
      y: cy
    }
    points.push({
      x,
      y
    })
    points.push({
      x: x + width,
      y
    })
    points.push({
      x: x + width,
      y: y + height
    })
    points.push({
      x,
      y: y + height
    })
    points.push({
      x,
      y
    })
    let rst = null
    for (let i = 1; i < points.length; i++) {
      rst = MathUtil.getLineIntersect(points[i - 1], points[i], center, point)
      if (rst) {
        break
      }
    }
    return rst
  },
  /**
   * get point and circle inIntersect
   * @param {Object} circle 圓點，x,y,r
   * @param {Object} point 點 x,y
   * @return {object} applied point
   */
  getCircleIntersectByPoint(circle, point) {
    const cx = circle.x
    const cy = circle.y
    const r = circle.r
    const { x, y } = point
    const d = Math.sqrt(Math.pow((x - cx), 2) + Math.pow((y - cy), 2))
    if (d < r) {
      return null
    }
    const dx = (x - cx)
    const dy = (y - cy)
    const signX = Math.sign(dx)
    const signY = Math.sign(dy)
    const angle = Math.atan(dy / dx)
    return {
      x: cx + Math.abs(r * Math.cos(angle)) * signX,
      y: cy + Math.abs(r * Math.sin(angle)) * signY
    }
  },
  /**
   * get point and ellipse inIntersect
   * @param {Object} ellipse 橢圓 x,y,rx,ry
   * @param {Object} point 點 x,y
   * @return {object} applied point
   */
  getEllispeIntersectByPoint(ellipse, point) {
    // 計算線段 (point.x, point.y) 到 (ellipse.x, ellipse.y) 與橢圓的交點
    const a = ellipse.rx
    const b = ellipse.ry
    const cx = ellipse.x
    const cy = ellipse.y
    // const c = Math.sqrt(a * a - b * b); // 焦距
    const dx = (point.x - cx)
    const dy = (point.y - cy)
    let angle = Math.atan2(dy / b, dx / a) // 直接通過 x,y 求夾角，求出來的範圍是 -PI, PI
    if (angle < 0) {
      angle += 2 * Math.PI // 轉換到 0，2PI
    }
    // 通過參數方程求交點
    // const r = (b * b) / (a - c * Math.sin(angle));
    return {
      x: cx + a * Math.cos(angle),
      y: cy + b * Math.sin(angle)
    }
  },
  /**
   * coordinate matrix transformation
   * @param  {number} point   coordinate
   * @param  {number} matrix  matrix
   * @param  {number} tag     could be 0 or 1
   * @return {object} transformed point
   */
  applyMatrix(point, matrix, tag = 1) {
    const vector = [point.x, point.y, tag]
    BaseUtil.vec3.transformMat3(vector, vector, matrix)
    return {
      x: vector[0],
      y: vector[1]
    }
  },
  /**
   * coordinate matrix invert transformation
   * @param  {number} point   coordinate
   * @param  {number} matrix  matrix
   * @param  {number} tag     could be 0 or 1
   * @return {object} transformed point
   */
  invertMatrix(point, matrix, tag = 1) {
    const inversedMatrix = BaseUtil.mat3.invert([], matrix)
    const vector = [point.x, point.y, tag]
    BaseUtil.vec3.transformMat3(vector, vector, inversedMatrix)
    return {
      x: vector[0],
      y: vector[1]
    }
  },

  /**
   * if the graph about the shortest path matrix is connected
   * @param  {array} matrix   shortest path matrix
   * @return {boolean} connected
   */
  isConnected(matrix) {
    if (matrix.length > 0) {
      for (let j = 0; j < matrix[0].length; j++) {
        if (matrix[0][j] === Infinity) return false
      }
    }
    return true
  },

  randomInitPos(size, xRange = [0, 1], yRange = [0, 1]) {
    const positions = []
    for (let i = 0; i < size; i++) {
      const x = Math.random() * (xRange[1] - xRange[0]) + xRange[0]
      const y = Math.random() * (yRange[1] - yRange[0]) + yRange[0]
      positions.push([x, y])
    }
    return positions
  },
  getCircleCenterByPoints(p1, p2, p3) {
    const a = p1.x - p2.x
    const b = p1.y - p2.y
    const c = p1.x - p3.x
    const d = p1.y - p3.y
    const e = (p1.x * p1.x - p2.x * p2.x - p2.y * p2.y + p1.y * p1.y) / 2
    const f = (p1.x * p1.x - p3.x * p3.x - p3.y * p3.y + p1.y * p1.y) / 2
    const denominator = b * c - a * d
    return {
      x: -(d * e - b * f) / denominator,
      y: -(a * f - c * e) / denominator
    }
  },
  distance(p1, p2) {
    const vx = p1.x - p2.x
    const vy = p1.y - p2.y
    return Math.sqrt(vx * vx + vy * vy)
  }
}
module.exports = BaseUtil.mix({}, BaseUtil, MathUtil)
