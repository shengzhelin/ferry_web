const Shape = require('../shape')
const deepMix = require('@antv/util/lib/deep-mix')
const Util = require('../../util')
const Global = require('../../global')

/**
 * 基本的橢圓，可以添加文本，默認文本居中
 */
Shape.registerNode('ellipse', {
  // 自定義節點時的配置
  options: {
    size: [120, 60],
    style: {
      x: 0,
      y: 0,
      stroke: Global.defaultShapeStrokeColor,
      fill: Global.defaultShapeFillColor,
      lineWidth: 1
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
        fillOpacity: 0.8
      },
      // 選中節點狀態下的配置
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
    // 節點中icon配置
    icon: {
      // 是否顯示icon，值為 false 則不渲染icon
      show: false,
      // icon的地址，字符串類型
      img: 'https://gw.alipayobjects.com/zos/basement_prod/012bcf4f-423b-4922-8c24-32a89f8c41ce.svg',
      width: 36,
      height: 36
    }
  },
  shapeType: 'ellipse',
  // 文本位置
  labelPosition: 'center',
  drawShape(cfg, group) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { icon: defaultIcon } = this.options
    const { icon: customIcon } = customOptions
    const style = this.getShapeStyle(cfg)
    const icon = deepMix({}, defaultIcon, customIcon, cfg.icon)

    const keyShape = group.addShape('ellipse', {
      attrs: style
    })

    const { width, height, show } = icon
    if (show) {
      const image = group.addShape('image', {
        attrs: {
          x: -width / 2,
          y: -height / 2,
          ...icon
        },
        className: 'ellipse-icon'
      })

      image.set('capture', false)
    }

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
    const rx = size[0] / 2
    const ry = size[1] / 2

    if (left) {
      // left circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: -rx,
          y: 0,
          r: markSize
        },
        className: 'ellipse-mark-left',
        isAnchorPoint: true
      })
    }

    if (right) {
      // right circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: rx,
          y: 0,
          r: markSize
        },
        className: 'ellipse-mark-right',
        isAnchorPoint: true
      })
    }

    if (top) {
      // top circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: 0,
          y: -ry,
          r: markSize
        },
        className: 'ellipse-mark-top',
        isAnchorPoint: true
      })
    }

    if (bottom) {
      // bottom circle
      group.addShape('circle', {
        attrs: {
          ...markStyle,
          x: 0,
          y: ry,
          r: markSize
        },
        className: 'ellipse-mark-bottom',
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
    const rx = size[0] / 2
    const ry = size[1] / 2
    const styles = Util.mix({}, {
      x: 0,
      y: 0,
      rx,
      ry
    }, style)
    return styles
  },
  update(cfg, item) {
    const customOptions = this.getCustomConfig(cfg) || {}
    const { style: defaultStyle, icon: defaultIcon, labelCfg: defaultLabelCfg } = this.options
    const { style: customStyle, icon: customIcon, labelCfg: customLabelCfg } = customOptions
    const style = deepMix({}, defaultStyle, customStyle, cfg.style)
    const icon = deepMix({}, defaultIcon, customIcon, cfg.icon)
    const size = this.getSize(cfg)

    const rx = size[0] / 2
    const ry = size[1] / 2

    const keyShape = item.get('keyShape')

    keyShape.attr({
      ...style,
      rx,
      ry
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

    const ellipseIcon = group.findByClassName('ellipse-icon')
    const { width: w, height: h } = icon
    if (ellipseIcon) {
      ellipseIcon.attr({
        x: -w / 2,
        y: -h / 2,
        ...icon
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

    const { size: markSize, ...markStyles } = linkPoints

    const size = this.getSize(cfg)
    const rx = size[0] / 2
    const ry = size[1] / 2

    const markLeft = group.findByClassName('ellipse-mark-left')
    if (markLeft) {
      markLeft.attr({
        ...markStyles,
        x: -rx,
        y: 0,
        r: markSize
      })
    }

    const markRight = group.findByClassName('ellipse-mark-right')
    if (markRight) {
      markRight.attr({
        ...markStyles,
        x: rx,
        y: 0,
        r: markSize
      })
    }

    const markTop = group.findByClassName('ellipse-mark-top')
    if (markTop) {
      markTop.attr({
        ...markStyles,
        x: 0,
        y: -ry,
        r: markSize
      })
    }

    const markBottom = group.findByClassName('ellipse-mark-bottom')
    if (markBottom) {
      markBottom.attr({
        ...markStyles,
        x: 0,
        y: ry,
        r: markSize
      })
    }
  }
}, 'single-shape')
