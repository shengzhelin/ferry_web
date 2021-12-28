/**
 * @fileOverview common node shape
 * @author huangtonger@aliyun.com
 */

const Shape = require('./shape')
const Util = require('../util/index')
const Global = require('../global')
const SingleShapeMixin = require('./single-shape-mixin')

// 註冊 Node 的工廠方法
Shape.registerFactory('node', {
  defaultShapeType: 'circle'
})

const singleNodeDefinition = Util.mix({}, SingleShapeMixin, {
  itemType: 'node',
  // 單個圖形的類型
  shapeType: '',
  /**
   * 文本相對圖形的位置，默認以中心點
   * 位置包括： top, bottom, left, right, center
   * @type {String}
   */
  labelPosition: 'center',
  /**
   * 獲取節點寬高
   * @internal 返回節點的大小，以 [width, height] 的方式維護
   * @param  {Object} cfg 節點的配置項
   * @return {Array} 寬高
   */
  getSize(cfg) {
    const customOptions = this.getCustomConfig(cfg) || {}
    let size = cfg.size || customOptions.size || this.options.size || Global.defaultNode.size
    if (!Util.isArray(size)) {
      size = [size, size]
    }
    return size
  },
  // 私有方法，不希望擴展的節點覆寫這個方法
  getLabelStyleByPosition(cfg, labelCfg) {
    const labelPosition = labelCfg.position || this.labelPosition

    // 默認的位置（最可能的情形），所以放在最上面
    if (labelPosition === 'center') {
      return { x: 0, y: 0 }
    }

    let offset = labelCfg.offset
    if (Util.isNil(offset)) { // 考慮 offset = 0 的場景，不用用 labelCfg.offset || Global.nodeLabel.offset
      offset = Global.nodeLabel.offset // 不居中時的偏移量
    }
    const size = this.getSize(cfg)
    const width = size[0]
    const height = size[1]

    let style
    switch (labelPosition) {
      case 'top':
        style = {
          x: 0,
          y: 0 - height / 2 - offset,
          textBaseline: 'bottom' // 文本在圖形的上面
        }
        break
      case 'bottom':
        style = {
          x: 0,
          y: height / 2 + offset,
          textBaseline: 'top'
        }
        break
      case 'left':
        style = {
          x: 0 - width / 2 - offset,
          y: 0,
          textAlign: 'right'
        }
        break
      default:
        style = {
          x: width / 2 + offset,
          y: 0,
          textAlign: 'left'
        }
        break
    }
    return style
  },
  drawShape(cfg, group) {
    const shapeType = this.shapeType // || this.type，都已經加了 shapeType
    const style = this.getShapeStyle(cfg)
    const shape = group.addShape(shapeType, {
      attrs: style
    })
    return shape
  }
})
// 單個圖形的基礎，可以有 label，默認 label 居中
Shape.registerNode('single-shape', singleNodeDefinition)
