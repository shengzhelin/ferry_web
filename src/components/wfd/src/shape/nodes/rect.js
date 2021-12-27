const Shape = require('../shape')
const deepMix = require('@antv/util/lib/deep-mix')
const Util = require('../../util')
const Global = require('../../global')

Shape.registerNode('rect', {
  // 自定義節點時的配置
  options: {
    size: [100, 30],
    style: {
      radius: 0,
      stroke: Global.defaultShapeStrokeColor,
      fill: Global.defaultShapeFillColor,
      lineWidth: 1,
      fillOpacity: 1
    },
    // 文本樣式配置
    labelCfg: {
      style: {
        fill: '#595959',
        fontSize: 12
      }
    },
    stateStyles: {
      // hover狀態下的配置
      hover: {
        fillOpacity: 0.8
      },
      // 節點選中狀態下的配置
      selected: {
        lineWidth: 3
      }
    },
    // 節點上左右上下四個方向上的鏈接circle配置
    linkPoints: {
      top: false,
      right: false,
      bottom: false,
      left: false,
      // circle的大小
      size: 3,
      lineWidth: 1,
      fill: '#72CC4A',
      stroke: '#72CC4A'
    },
    // 連接點，默認為左右
    markPoints: [[0, 0.5], [1, 0.5]]
  },
  shapeType: 'rect',
  drawShape(cfg, group) {
    const style = this.getShapeStyle(cfg)

    const keyShape = group.addShape('rect', {
      attrs: style,
      className: 'rect-keyShape'
    })

    this.drawLinkPoints(cfg, group)
    return keyShape
  },
  /**
   * 繪制節點上的LinkPoints
   * @param {Object} cfg data數據配置項
   * @param {Group} group Group實例
   */
  drawLinkPoints(cfg, group) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { linkPoints: defaultLinkPoints } = this.options
    const { linkPoints: customLinkPoints } = customOptions
    const linkPoints = deepMix({}, defaultLinkPoints, customLinkPoints, cfg.linkPoints)

    const { top, left, right, bottom, size: markSize,
      ...markStyle } = linkPoints
    const size = this.getSize(cfg)
    const width = size[0]
    const height = size[1]

    if (left) {
      // left circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: -width / 2,
          y: 0,
          r: markSize
        },
        className: 'rect-mark-left',
        isAnchorPoint: true
      })
    }

    if (right) {
      // right circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: width / 2,
          y: 0,
          r: markSize
        },
        className: 'rect-mark-right',
        isAnchorPoint: true
      })
    }

    if (top) {
      // top circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: 0,
          y: -height / 2,
          r: markSize
        },
        className: 'rect-mark-top',
        isAnchorPoint: true
      })
    }

    if (bottom) {
      // bottom circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: 0,
          y: height / 2,
          r: markSize
        },
        className: 'rect-mark-bottom',
        isAnchorPoint: true
      })
    }
  },
  /**
   * 獲取節點的樣式，供基於該節點自定義時使用
   * @param {Object} cfg 節點數據模型
   * @return {Object} 節點的樣式
   */
  getShapeStyle(cfg) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { style: defaultStyle } = this.options
    const { style: customStyle } = customOptions
    const strokeStyle = {
      stroke: cfg.color
    }
    // 如果設置了color，則覆蓋默認的stroke屬性
    const style = deepMix({}, defaultStyle, customStyle, strokeStyle, cfg.style)
    const size = this.getSize(cfg)
    const width = size[0]
    const height = size[1]
    const styles = Util.mix({}, {
      x: -width / 2,
      y: -height / 2,
      width,
      height
    }, style)
    return styles
  },
  update(cfg, item) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { style: defaultStyle, labelCfg: defaultLabelCfg } = this.options
    const { style: customStyle, labelCfg: customLabelCfg } = customOptions
    const style = deepMix({}, defaultStyle, customStyle, cfg.style)
    const size = this.getSize(cfg)
    const width = size[0]
    const height = size[1]

    const keyShape = item.get('keyShape')
    keyShape.attr({
      x: -width / 2,
      y: -height / 2,
      width,
      height,
      ...style
    })

    const group = item.getContainer()

    const labelCfg = deepMix({}, defaultLabelCfg, customLabelCfg, cfg.labelCfg)
    const labelStyle = this.getLabelStyle(cfg, labelCfg, group)
    const text = group.findByClassName('node-label')
    if (text) {
      text.attr({
        ...labelStyle
      })
    }
    this.updateLinkPoints(cfg, group)
  },
  /**
   * 更新linkPoints
   * @param {Object} cfg 節點數據配置項
   * @param {Group} group Item所在的group
   */
  updateLinkPoints(cfg, group) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { linkPoints: defaultLinkPoints } = this.options
    const { linkPoints: customLinkPoints } = customOptions
    const linkPoints = deepMix({}, defaultLinkPoints, customLinkPoints, cfg.linkPoints)

    const { size: markSize, fill: markFill, stroke: markStroke, lineWidth: borderWidth } = linkPoints

    const size = this.getSize(cfg)
    const width = size[0]
    const height = size[1]

    const markLeft = group.findByClassName('rect-mark-left')
    if (markLeft) {
      markLeft.attr({
        x: -width / 2,
        y: 0,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      })
    }

    const markRight = group.findByClassName('rect-mark-right')
    if (markRight) {
      markRight.attr({
        x: width / 2,
        y: 0,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      })
    }

    const markTop = group.findByClassName('rect-mark-top')
    if (markTop) {
      markTop.attr({
        x: 0,
        y: -height / 2,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      })
    }

    const markBottom = group.findByClassName('rect-mark-bottom')
    if (markBottom) {
      markBottom.attr({
        x: 0,
        y: height / 2,
        r: markSize,
        fill: markFill,
        stroke: markStroke,
        lineWidth: borderWidth
      })
    }
  }
}, 'single-shape')
