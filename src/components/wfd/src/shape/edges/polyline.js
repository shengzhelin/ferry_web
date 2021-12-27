const Shape = require('../shape')
const Util = require('../../util')
const PolylineUtil = require('./polyline-util')
const Global = require('../../global')

const CLS_SHAPE_SUFFIX = '-shape'
const CLS_LABEL_SUFFIX = '-label'

// 折線
Shape.registerEdge('polyline', {
  options: {
    color: '#999',
    style: {
      stroke: '#333',
      lineWidth: 1,
      radius: 0,
      offset: 5,
      x: 0,
      y: 0
    },
    // 文本樣式配置
    labelCfg: {
      style: {
        fill: '#595959'
      }
    },
    stateStyles: {
      // 鼠標hover狀態下的配置
      hover: {
        lineWidth: 3
      },
      // 選中邊狀態下的配置
      selected: {
        lineWidth: 5
      }
    }
  },
  shapeType: 'polyline',
  // 文本位置
  labelPosition: 'center',
  drawShape(cfg, group) {
    const shapeStyle = this.getShapeStyle(cfg)
    const keyShape = group.addShape('path', {
      className: 'edge-shape',
      attrs: shapeStyle
    })
    return keyShape
  },
  getShapeStyle(cfg) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { style: defaultStyle } = this.options
    const { style: customStyle } = customOptions

    const strokeStyle = {
      stroke: cfg.color
    }

    const style = Util.deepMix({}, defaultStyle, customStyle, strokeStyle, cfg.style)
    cfg = this.getPathPoints(cfg)
    this.radius = style.radius
    this.offset = style.offset
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
    const source = cfg.sourceNode
    const target = cfg.targetNode
    let routeCfg = { radius: style.radius }
    if (!controlPoints) {
      routeCfg = { source, target, offset: style.offset, radius: style.radius }
    }
    const path = this.getPath(points, routeCfg)
    const attrs = Util.deepMix({}, Global.defaultEdge.style, style, {
      lineWidth: cfg.size
    }, { path })
    return attrs
  },
  getPath(points, routeCfg) {
    const { source, target, offset, radius } = routeCfg
    if (!offset) {
      let path = []
      if (radius) {
        path = PolylineUtil.getPathWithBorderRadiusByPolyline(points, radius)
      } else {
        Util.each(points, (point, index) => {
          if (index === 0) {
            path.push(['M', point.x, point.y])
          } else {
            path.push(['L', point.x, point.y])
          }
        })
      }
      return path
    }
    if (radius) {
      const polylinePoints = PolylineUtil.simplifyPolyline(
        PolylineUtil.getPolylinePoints(points[0], points[points.length - 1], source, target, offset)
      )
      return PolylineUtil.getPathWithBorderRadiusByPolyline(polylinePoints, radius)
    }
    const polylinePoints = PolylineUtil.getPolylinePoints(points[0],
      points[points.length - 1], source, target, offset)
    return Util.pointsToPolygon(polylinePoints)
  },

  update(cfg, item) {
    const group = item.getContainer()
    const shapeClassName = this.itemType + CLS_SHAPE_SUFFIX
    const shape = group.findByClassName(shapeClassName)
    if (!cfg.style) {
      cfg.style = {}
    }
    const oriShapeAttrs = shape.attr()
    cfg.style.radius = cfg.style.radius || oriShapeAttrs.radius
    cfg.style.offset = cfg.style.offset || oriShapeAttrs.offset
    const shapeStyle = this.getShapeStyle(cfg)
    shape.attr(shapeStyle)
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
        const { labelCfg: defaultLabelCfg } = this.options
        const { labelCfg: customLabelCfg } = this.getCustomConfig(cfg) || {}

        const labelCfg = Util.deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg)
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
  }
}, 'single-line')
