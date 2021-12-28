/**
 * @fileOverview 自定義邊
 * @description 自定義邊中有大量邏輯同自定義節點重覆，雖然可以提取成為 mixin ，但是考慮到代碼的可讀性，還是單獨實現。
 * @author dxq613@gmail.com
 */

const Shape = require('./shape')
const Util = require('../util')
const Global = require('../global')
const SingleShapeMixin = require('./single-shape-mixin')
const CLS_SHAPE = 'edge-shape'

// start,end 倒置，center 不變
function revertAlign(labelPosition) {
  let textAlign = labelPosition
  if (labelPosition === 'start') {
    textAlign = 'end'
  } else if (labelPosition === 'end') {
    textAlign = 'start'
  }
  return textAlign
}

// 註冊 Edge 的工廠方法
Shape.registerFactory('edge', {
  defaultShapeType: 'line'
})

const singleEdgeDefinition = Util.mix({}, SingleShapeMixin, {
  itemType: 'edge',
  /**
   * 文本的位置
   * @type {String}
   */
  labelPosition: 'center', // start, end, center
  /**
   * 文本是否跟著線自動旋轉，默認 false
   * @type {Boolean}
   */
  labelAutoRotate: false,
  /**
   * 獲取邊的 path
   * @internal 供擴展的邊覆蓋
   * @param  {Array} points 構成邊的點的集合
   * @return {Array} 構成 path 的數組
   */
  getPath(points) {
    const path = []
    Util.each(points, (point, index) => {
      if (index === 0) {
        path.push(['M', point.x, point.y])
      } else {
        path.push(['L', point.x, point.y])
      }
    })
    return path
  },
  getShapeStyle(cfg) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { style: defaultStyle } = this.options
    const { style: customStyle } = customOptions
    const strokeStyle = {
      stroke: cfg.color
    }
    // 如果設置了color，則覆蓋默認的stroke屬性
    const style = Util.deepMix({}, defaultStyle, customStyle, strokeStyle, cfg.style)

    const size = cfg.size || Global.defaultEdge.size
    cfg = this.getPathPoints(cfg)
    const startPoint = cfg.startPoint
    const endPoint = cfg.endPoint
    const controlPoints = this.getControlPoints(cfg)
    let points = [startPoint] // 添加起始點
    // 添加控制點
    if (controlPoints) {
      points = points.concat(controlPoints)
    }
    // 添加結束點
    points.push(endPoint)
    const path = this.getPath(points)
    const styles = Util.mix({}, Global.defaultEdge.style, {
      stroke: Global.defaultEdge.color,
      lineWidth: size,
      path
    }, style)
    return styles
  },
  getLabelStyleByPosition(cfg, labelCfg, group) {
    const labelPosition = labelCfg.position || this.labelPosition // 文本的位置用戶可以傳入
    const style = {}
    const pathShape = group.findByClassName(CLS_SHAPE)
    // 不對 pathShape 進行判空，如果線不存在，說明有問題了
    let pointPercent
    if (labelPosition === 'start') {
      pointPercent = 0
    } else if (labelPosition === 'end') {
      pointPercent = 1
    } else {
      pointPercent = 0.5
    }
    const { refX, refY } = labelCfg // 默認的偏移量
    // 如果兩個節點重疊，線就變成了一個點，這時候label的位置，就是這個點 + 絕對偏移
    if (cfg.startPoint.x === cfg.endPoint.x && cfg.startPoint.y === cfg.endPoint.y) {
      style.x = cfg.startPoint.x + refX ? refX : 0
      style.y = cfg.endPoint.y + refY ? refY : 0
      return style
    }
    const autoRotate = Util.isNil(labelCfg.autoRotate) ? this.labelAutoRotate : labelCfg.autoRotate
    const offsetStyle = Util.getLabelPosition(pathShape, pointPercent, refX, refY, autoRotate)
    style.x = offsetStyle.x
    style.y = offsetStyle.y
    style.rotate = offsetStyle.rotate
    style.textAlign = this._getTextAlign(labelPosition, offsetStyle.angle)
    return style
  },
  // 獲取文本對齊方式
  _getTextAlign(labelPosition, angle) {
    let textAlign = 'center'
    if (!angle) {
      return labelPosition
    }
    angle = angle % (Math.PI * 2) // 取模
    if (labelPosition !== 'center') {
      if ((angle >= 0 && angle <= Math.PI / 2) || (angle >= 3 / 2 * Math.PI && angle < 2 * Math.PI)) {
        textAlign = labelPosition
      } else {
        textAlign = revertAlign(labelPosition)
      }
    }
    return textAlign
  },
  /**
   * @internal 獲取邊的控制點
   * @param  {Object} cfg 邊的配置項
   * @return {Array} 控制點的數組
   */
  getControlPoints(cfg) {
    return cfg.controlPoints
  },
  /**
   * @internal 處理需要重計算點和邊的情況
   * @param {Object} cfg 邊的配置項
   * @return {Object} 邊的配置項
   */
  getPathPoints(cfg) {
    return cfg
  },
  /**
   * 繪制邊
   * @override
   * @param  {Object} cfg   邊的配置項
   * @param  {G.Group} group 邊的容器
   * @return {G.Shape} 圖形
   */
  drawShape(cfg, group) {
    const shapeStyle = this.getShapeStyle(cfg)
    const shape = group.addShape('path', {
      className: CLS_SHAPE,
      attrs: shapeStyle
    })
    return shape
  },
  drawLabel(cfg, group) {
    const customStyle = this.getCustomConfig(cfg) || {}
    const defaultConfig = customStyle.default || {}
    const labelCfg = Util.deepMix({}, this.options.labelCfg, defaultConfig.labelCfg, cfg.labelCfg)
    const labelStyle = this.getLabelStyle(cfg, labelCfg, group)
    const label = group.addShape('text', {
      attrs: labelStyle
    })
    return label
  }
})

// // 直線
Shape.registerEdge('single-line', singleEdgeDefinition)

// // 直線, 不支持控制點
Shape.registerEdge('line', {
  // 控制點不生效
  getControlPoints() {
    return []
  }
}, 'single-line')

// // 折線，支持多個控制點
// Shape.registerEdge('polyline', {}, 'single-line');

// 直線
Shape.registerEdge('spline', {
  getPath(points) {
    const path = Util.getSpline(points)
    return path
  }
}, 'single-line')

Shape.registerEdge('arc', {
  curveOffset: 20,
  clockwise: 1,
  getControlPoints(cfg) {
    const startPoint = cfg.startPoint
    const endPoint = cfg.endPoint
    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    }
    let center
    let arcPoint
    // 根據給定點計算圓弧
    if (cfg.controlPoints !== undefined) {
      arcPoint = cfg.controlPoints[0]
      center = Util.getCircleCenterByPoints(startPoint, arcPoint, endPoint)
      // 根據控制點和直線關系決定 clockwise值
      if (startPoint.x <= endPoint.x && startPoint.y > endPoint.y) {
        this.clockwise = center.x > midPoint.x ? 1 : 0
      } else if (startPoint.x <= endPoint.x && startPoint.y < endPoint.y) {
        this.clockwise = center.x > midPoint.x ? 0 : 1
      } else if (startPoint.x > endPoint.x && startPoint.y <= endPoint.y) {
        this.clockwise = center.y < midPoint.y ? 1 : 0
      } else {
        this.clockwise = center.y < midPoint.y ? 1 : 0
      }
      // 若給定點和兩端點共線，無法生成圓弧，繪制直線
      if ((arcPoint.x - startPoint.x) / (arcPoint.y - startPoint.y) ===
        (endPoint.x - startPoint.x) / (endPoint.y - startPoint.y)) {
        return []
      }
    } else { // 根據直線連線中點的的偏移計算圓弧
      // 若用戶給定偏移量則根據其計算，否則按照默認偏移值計算
      if (cfg.curveOffset !== undefined) {
        this.curveOffset = cfg.curveOffset
      }
      if (this.curveOffset < 0) this.clockwise = 0
      else this.clockwise = 1
      const vec = {
        x: endPoint.x - startPoint.x,
        y: endPoint.y - startPoint.y
      }
      const edgeAngle = Math.atan2(vec.y, vec.x)
      arcPoint = {
        x: this.curveOffset * Math.cos((-Math.PI / 2 + edgeAngle)) + midPoint.x,
        y: this.curveOffset * Math.sin((-Math.PI / 2 + edgeAngle)) + midPoint.y
      }
      center = Util.getCircleCenterByPoints(startPoint, arcPoint, endPoint)
    }
    const radius = Util.distance(startPoint, center)
    const controlPoints = [{ x: radius, y: radius }]

    return controlPoints
  },
  getPath(points) {
    const path = []
    path.push(['M', points[0].x, points[0].y])
    // 控制點與端點共線
    if (points.length === 2) {
      path.push(['L', points[1].x, points[1].y])
    } else {
      path.push(['A', points[1].x, points[1].y, 0, 0, this.clockwise, points[2].x, points[2].y])
    }
    return path
  }
}, 'single-line')

Shape.registerEdge('quadratic', {
  curvePosition: 0.5, // 彎曲的默認位置
  curveOffset: -20, // 彎曲度，沿著startPoint, endPoint 的垂直向量（順時針）方向，距離線的距離，距離越大越彎曲
  getControlPoints(cfg) {
    let controlPoints = cfg.controlPoints // 指定controlPoints
    if (!controlPoints || !controlPoints.length) {
      const { startPoint, endPoint } = cfg
      const innerPoint = Util.getControlPoint(startPoint, endPoint, this.curvePosition, this.curveOffset)
      controlPoints = [innerPoint]
    }
    return controlPoints
  },
  getPath(points) {
    const path = []
    path.push(['M', points[0].x, points[0].y])
    path.push(['Q', points[1].x, points[1].y, points[2].x, points[2].y])
    return path
  }
}, 'single-line')

Shape.registerEdge('cubic', {
  curvePosition: [1 / 2, 1 / 2],
  curveOffset: [-20, 20],
  getControlPoints(cfg) {
    let controlPoints = cfg.controlPoints // 指定controlPoints
    if (!controlPoints || !controlPoints.length) {
      const { startPoint, endPoint } = cfg
      const innerPoint1 = Util.getControlPoint(startPoint, endPoint, this.curvePosition[0], this.curveOffset[0])
      const innerPoint2 = Util.getControlPoint(startPoint, endPoint, this.curvePosition[1], this.curveOffset[1])
      controlPoints = [innerPoint1, innerPoint2]
    }
    return controlPoints
  },
  getPath(points) {
    const path = []
    path.push(['M', points[0].x, points[0].y])
    path.push(['C', points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y])
    return path
  }
}, 'single-line')

// 垂直方向的三階貝塞爾曲線，不再考慮用戶外部傳入的控制點
Shape.registerEdge('cubic-vertical', {
  curvePosition: [1 / 2, 1 / 2],
  getControlPoints(cfg) {
    const { startPoint, endPoint } = cfg
    const innerPoint1 = {
      x: startPoint.x,
      y: (endPoint.y - startPoint.y) * this.curvePosition[0] + startPoint.y
    }
    const innerPoint2 = {
      x: endPoint.x,
      y: (endPoint.y - startPoint.y) * this.curvePosition[1] + startPoint.y
    }
    const controlPoints = [innerPoint1, innerPoint2]
    return controlPoints
  }
}, 'cubic')

// 水平方向的三階貝塞爾曲線，不再考慮用戶外部傳入的控制點
Shape.registerEdge('cubic-horizontal', {
  curvePosition: [1 / 2, 1 / 2],
  getControlPoints(cfg) {
    const { startPoint, endPoint } = cfg
    const innerPoint1 = {
      x: (endPoint.x - startPoint.x) * this.curvePosition[0] + startPoint.x,
      y: startPoint.y
    }
    const innerPoint2 = {
      x: (endPoint.x - startPoint.x) * this.curvePosition[1] + startPoint.x,
      y: endPoint.y
    }
    const controlPoints = [innerPoint1, innerPoint2]
    return controlPoints
  }
}, 'cubic')

Shape.registerEdge('loop', {
  getPathPoints(cfg) {
    return Util.getLoopCfgs(cfg)
  },
  getControlPoints(cfg) {
    return cfg.controlPoints
  },
  afterDraw(cfg) {
    cfg.controlPoints = null
  },
  afterUpdate(cfg) {
    cfg.controlPoints = null
  }
}, 'cubic')
