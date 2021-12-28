const Hierarchy = require('@antv/hierarchy')
const Util = require('../util')
const Graph = require('./graph')

function indexOfChild(children, child) {
  let index = -1
  Util.each(children, (former, i) => {
    if (child.id === former.id) {
      index = i
      return false
    }
  })
  return index
}

class TreeGraph extends Graph {
  constructor(cfg) {
    super(cfg)
    // 用於緩存動畫結束後需要刪除的節點
    this.set('removeList', [])
    this.set('layoutMethod', this._getLayout())
  }
  getDefaultCfg() {
    const cfg = super.getDefaultCfg()
    // 樹圖默認打開動畫
    cfg.animate = true
    return cfg
  }
  /**
   * 根據data接口的數據渲染視圖
   */
  render() {
    const self = this
    const data = self.get('data')
    if (!data) {
      throw new Error('data must be defined first')
    }
    self.clear()
    self.emit('beforerender')
    self.refreshLayout(this.get('fitView'))
    self.emit('afterrender')
  }
  /**
   * 添加子樹到對應 id 的節點
   * @param {object} data 子樹數據模型
   * @param {string} parent 子樹的父節點id
   */
  addChild(data, parent) {
    const self = this
    // 將數據添加到源數據中，走changeData方法
    if (!Util.isString(parent)) {
      parent = parent.get('id')
    }
    const parentData = self.findDataById(parent)
    if (!parentData.children) {
      parentData.children = []
    }
    parentData.children.push(data)
    self.changeData()
  }
  // 計算好layout的數據添加到graph中
  _addChild(data, parent, animate) {
    const self = this
    const model = data.data
    // model 中應存儲真實的數據，特別是真實的 children
    model.x = data.x
    model.y = data.y
    model.depth = data.depth
    const node = self.addItem('node', model)
    if (parent) {
      node.set('parent', parent)
      if (animate) {
        const origin = parent.get('origin')
        if (origin) {
          node.set('origin', origin)
        } else {
          const parentModel = parent.getModel()
          node.set('origin', {
            x: parentModel.x,
            y: parentModel.y
          })
        }
      }
      const childrenList = parent.get('children')
      if (!childrenList) {
        parent.set('children', [node])
      } else {
        childrenList.push(node)
      }
      self.addItem('edge', { source: parent, target: node, id: parent.get('id') + ':' + node.get('id') })
    }
    // 渲染到視圖上應參考佈局的children, 避免多繪制了收起的節點
    Util.each(data.children, child => {
      self._addChild(child, node, animate)
    })
    return node
  }
  /**
   * 更新數據模型，差量更新並重新渲染
   * @param {object} data 數據模型
   */
  changeData(data) {
    const self = this
    if (data) {
      self.data(data)
      self.render()
    } else {
      self.refreshLayout(this.get('fitView'))
    }
  }
  /**
   * 更新源數據，差量更新子樹
   * @param {object} data 子樹數據模型
   * @param {string} parent 子樹的父節點id
   */
  updateChild(data, parent) {
    const self = this
    // 如果沒有父節點或找不到該節點，是全量的更新，直接重置data
    if (!parent || !self.findById(parent)) {
      self.changeData(data)
      return
    }
    const parentModel = self.findById(parent).getModel()
    const current = self.findById(data.id)
    // 如果不存在該節點，則添加
    if (!current) {
      if (!parentModel.children) {
        parentModel.children = [current]
      } else {
        parentModel.children.push(data)
      }
    } else {
      const index = indexOfChild(parentModel.children, data)
      parentModel.children[index] = data
    }
    self.changeData()
  }

  // 將數據上的變更轉換到視圖上
  _updateChild(data, parent, animate) {
    const self = this
    const current = self.findById(data.id)
    // 若子樹不存在，整體添加即可
    if (!current) {
      self._addChild(data, parent, animate)
      return
    }
    // 更新新節點下所有子節點
    Util.each(data.children, child => {
      self._updateChild(child, current, animate)
    })
    // 用現在節點的children實例來刪除移除的子節點
    const children = current.get('children')
    if (children) {
      const len = children.length
      if (len > 0) {
        let child
        for (let i = children.length - 1; i >= 0; i--) {
          child = children[i].getModel()
          if (indexOfChild(data.children, child) === -1) {
            self._removeChild(child.id, {
              x: data.x,
              y: data.y
            }, animate)
            // 更新父節點下緩存的子節點 item 實例列表
            children.splice(i, 1)
          }
        }
      }
    }
    const model = current.getModel()
    if (animate) {
      // 如果有動畫，先緩存節點運動再更新節點
      current.set('origin', {
        x: model.x,
        y: model.y
      })
    }
    current.set('model', data.data)
    current.updatePosition({ x: data.x, y: data.y })
  }
  /**
   * 刪除子樹
   * @param {string} id 子樹根節點id
   */
  removeChild(id) {
    const self = this
    const node = self.findById(id)
    if (!node) {
      return
    }
    const parent = node.get('parent')
    if (parent && !parent.destroyed) {
      const siblings = self.findDataById(parent.get('id')).children
      const index = indexOfChild(siblings, node.getModel())
      siblings.splice(index, 1)
    }
    self.changeData()
  }
  // 刪除子節點Item對象
  _removeChild(id, to, animate) {
    const self = this
    const node = self.findById(id)
    if (!node) {
      return
    }
    Util.each(node.get('children'), child => {
      self._removeChild(child.getModel().id, to, animate)
    })
    if (animate) {
      const model = node.getModel()
      node.set('to', to)
      node.set('origin', { x: model.x, y: model.y })
      self.get('removeList').push(node)
    } else {
      self.removeItem(node)
    }
  }
  /**
   * 導出圖數據
   * @return {object} data
   */
  save() {
    return this.get('data')
  }
  /**
   * 根據id獲取對應的源數據
   * @param {string|object} id 元素id
   * @param {object} parent 從哪個節點開始尋找，為空時從根節點開始查找
   * @return {object} 對應源數據
   */
  findDataById(id, parent) {
    const self = this
    if (!parent) {
      parent = self.get('data')
    }
    if (id === parent.id) {
      return parent
    }
    let result = null
    Util.each(parent.children, child => {
      if (child.id === id) {
        result = child
        return false
      }
      result = self.findDataById(id, child)
      if (result) {
        return false
      }
    })
    return result
  }
  /**
   * 更改並應用樹佈局算法
   * @param {object} layout 佈局算法
   */
  changeLayout(layout) {
    const self = this
    if (!layout) {
      console.warn('layout cannot be null')
      return
    }
    self.set('layout', layout)
    self.set('layoutMethod', self._getLayout())
    self.refreshLayout()
  }

  /**
   * 根據目前的 data 刷新佈局，更新到畫布上。用於變更數據之後刷新視圖。
   * @param {boolean} fitView 更新佈局時是否需要適應窗口
   */
  refreshLayout(fitView) {
    const self = this
    const data = self.get('data')
    const layoutData = self.get('layoutMethod')(data, self.get('layout'))
    const animate = self.get('animate')
    const autoPaint = self.get('autoPaint')
    self.emit('beforerefreshlayout', { data, layoutData })
    self.setAutoPaint(false)
    self._updateChild(layoutData, null, animate)
    if (fitView) {
      self.get('viewController')._fitView()
    }
    if (!animate) {
      // 如果沒有動畫，目前僅更新了節點的位置，刷新一下邊的樣式
      self.refresh()
      self.paint()
    } else {
      self.layoutAnimate(layoutData, null)
    }
    self.setAutoPaint(autoPaint)
    self.emit('afterrefreshlayout', { data, layoutData })
  }
  /**
   * 佈局動畫接口，用於數據更新時做節點位置更新的動畫
   * @param {object} data 更新的數據
   * @param {function} onFrame 定義節點位置更新時如何移動
   * @param {number} duration 動畫時間
   * @param {string} ease 指定動效
   * @param {function} callback 動畫結束的回調
   * @param {number} delay 動畫延遲執行(ms)
   */
  layoutAnimate(data, onFrame) {
    const self = this
    this.setAutoPaint(false)
    const animateCfg = this.get('animateCfg')
    self.emit('beforeanimate', { data })
    // 如果邊中沒有指定錨點，但是本身有錨點控制，在動畫過程中保持錨點不變
    self.getEdges().forEach(edge => {
      const model = edge.get('model')
      if (!model.sourceAnchor) {
        model.sourceAnchor = edge.get('sourceAnchorIndex')
      }
    })
    this.get('canvas').animate({
      onFrame(ratio) {
        Util.traverseTree(data, child => {
          const node = self.findById(child.id)
          // 只有當存在node的時候才執行
          if (node) {
            let origin = node.get('origin')
            const model = node.get('model')
            if (!origin) {
              origin = {
                x: model.x,
                y: model.y
              }
              node.set('origin', origin)
            }
            if (onFrame) {
              const attrs = onFrame(node, ratio, origin, data)
              node.set('model', Util.mix(model, attrs))
            } else {
              model.x = origin.x + (child.x - origin.x) * ratio
              model.y = origin.y + (child.y - origin.y) * ratio
            }
          }
        })
        Util.each(self.get('removeList'), node => {
          const model = node.getModel()
          const from = node.get('origin')
          const to = node.get('to')
          model.x = from.x + (to.x - from.x) * ratio
          model.y = from.y + (to.y - from.y) * ratio
        })
        self.refreshPositions()
      }
    }, animateCfg.duration, animateCfg.ease, () => {
      Util.each(self.getNodes(), node => {
        node.set('origin', null)
      })
      Util.each(self.get('removeList'), node => {
        self.removeItem(node)
      })
      self.set('removeList', [])
      if (animateCfg.callback) {
        animateCfg.callback()
      }
      self.paint()
      this.setAutoPaint(true)
      self.emit('afteranimate', { data })
    }, animateCfg.delay)
  }
  /**
   * 立即停止佈局動畫
   */
  stopLayoutAnimate() {
    this.get('canvas').stopAnimate()
    this.emit('layoutanimateend', { data: this.get('data') })
    this.layoutAnimating = false
  }

  /**
   * 是否在佈局動畫
   * @return {boolean} 是否有佈局動畫
   */
  isLayoutAnimating() {
    return this.layoutAnimating
  }
  _getLayout() {
    const layout = this.get('layout')
    if (!layout) {
      return null
    }
    if (typeof layout === 'function') {
      return layout
    }
    if (!layout.type) {
      layout.type = 'dendrogram'
    }
    if (!layout.direction) {
      layout.direction = 'TB'
    }
    if (layout.radial) {
      return function(data) {
        const layoutData = Hierarchy[layout.type](data, layout)
        Util.radialLayout(layoutData)
        return layoutData
      }
    }
    return function(data) {
      return Hierarchy[layout.type](data, layout)
    }
  }
}

module.exports = TreeGraph
