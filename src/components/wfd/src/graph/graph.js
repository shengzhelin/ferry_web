/*
 * @Author: moyee
 * @Date: 2019-06-27 18:12:06
 * @LastEditors: moyee
 * @LastEditTime: 2019-08-22 11:22:16
 * @Description: Graph
 */
const { groupBy, isString } = require('lodash')
const G = require('@antv/g/lib')
const EventEmitter = G.EventEmitter
const Util = require('../util')
const Global = require('../global')

const Controller = require('./controller')
const NODE = 'node'
const EDGE = 'edge'

class Graph extends EventEmitter {
  /**
   * Access to the default configuration properties
   * @return {object} default configuration
   */
  getDefaultCfg() {
    return {
      /**
       * Container could be dom object or dom id
       * @type {object|string|undefined}
       */
      container: undefined,

      /**
       * Canvas width
       * @type {number|undefined}
       * unit pixel if undefined force fit width
       */
      width: undefined,

      /**
       * Canvas height
       * @type {number|undefined}
       * unit pixel if undefined force fit height
       */
      height: undefined,
      /**
       * renderer canvas or svg
       * @type {string}
       */
      renderer: 'canvas',
      /**
       * control graph behaviors
       * @type Array
       */
      mode: [],
      /**
       * 注冊插件
       */
      plugins: [],
      /**
       * source data
       * @type object
       */
      data: null,
      /**
       * Fit view padding (client scale)
       * @type {number|array}
       */
      fitViewPadding: 10,
      /**
       * Minimum scale size
       * @type {number}
       */
      minZoom: 0.2,
      /**
       * Maxmum scale size
       * @type {number}
       */
      maxZoom: 10,
      /**
       *  capture events
       *  @type boolean
       */
      event: true,
      /**
       * group node & edges into different graphic groups
       * @private
       * @type boolean
       */
      groupByTypes: true,
      /**
       * determine if it's a directed graph
       * @type boolean
       */
      directed: false,
      /**
       * when data or shape changed, should canvas draw automatically
       * @type boolean
       */
      autoPaint: true,
      /**
       * store all the node instances
       * @type [object]
       */
      nodes: [],
      /**
       * store all the edge instances
       * @type [object]
       */
      edges: [],
      /**
       * all the instances indexed by id
       * @type object
       */
      itemMap: {},
      /**
       * 邊直接連接到節點的中心，不再考慮錨點
       * @type {Boolean}
       */
      linkCenter: false,
      /**
       * 默認的節點配置，data 上定義的配置會覆蓋這些配置。例如：
       * defaultNode: {
       *  shape: 'rect',
       *  size: [60, 40],
       *  style: {
       *    //... 樣式配置項
       *  }
       * }
       * 若數據項為 { id: 'node', x: 100, y: 100 }
       * 實際創建的節點模型是 { id: 'node', x: 100, y: 100， shape: 'rect', size: [60, 40] }
       * 若數據項為 { id: 'node', x: 100, y: 100, shape: 'circle' }
       * 實際創建的節點模型是 { id: 'node', x: 100, y: 100， shape: 'circle', size: [60, 40] }
       */
      defaultNode: {},
      /**
       * 默認邊配置，data 上定義的配置會覆蓋這些配置。用法同 defaultNode
       */
      defaultEdge: {},
      /**
       * 節點默認樣式，也可以添加狀態樣式
       * 例如：
       * const graph = new G6.Graph({
       *  nodeStateStyle: {
       *    selected: { fill: '#ccc', stroke: '#666' },
       *    active: { lineWidth: 2 }
       *  },
       *  ...
       * });
       *
       */
      nodeStateStyles: {},
      /**
       * 邊默認樣式，用法同nodeStateStyle
       */
      edgeStateStyles: {},
      /**
       * graph 狀態
       */
      states: {},
      /**
       * 是否啟用全局動畫
       * @type {Boolean}
       */
      animate: false,
      /**
       * 動畫設置,僅在 animate 為 true 時有效
       * @type {Object}
       */
      animateCfg: {
        /**
         * 幀回調函數，用於自定義節點運動路徑，為空時線性運動
         * @type {Function|null}
         */
        onFrame: null,
        /**
         * 動畫時長(ms)
         * @type {Number}
         */
        duration: 500,
        /**
         * 指定動畫動效
         * @type {String}
         */
        easing: 'easeLinear'
      },
      callback: null,
      /**
       * group類型
       */
      groupType: 'circle',
      /**
       * 各個group的BBox
      */
      groupBBoxs: {},
      /**
       * 每個group包含的節點，父層的包括自己的節點以及子Group的節點
      */
      groupNodes: {},
      /**
       * 群組的原始數據
      */
      groups: [],
      groupStyle: {}
    }
  }

  constructor(inputCfg) {
    super()
    this._cfg = Util.deepMix(this.getDefaultCfg(), inputCfg) // merge graph configs
    this._init()
  }
  _init() {
    this._initCanvas()
    const eventController = new Controller.Event(this)
    const viewController = new Controller.View(this)
    const modeController = new Controller.Mode(this)
    const itemController = new Controller.Item(this)
    const stateController = new Controller.State(this)
    const layoutController = new Controller.Layout(this)
    // 實例化customGroup
    const customGroupControll = new Controller.CustomGroup(this)
    this.set({
      eventController,
      viewController,
      modeController,
      itemController,
      stateController,
      customGroupControll,
      layoutController
    })
    this._initPlugins()
  }
  _initCanvas() {
    let container = this.get('container')
    if (Util.isString(container)) {
      container = document.getElementById(container)
      this.set('container', container)
    }
    if (!container) {
      throw Error('invalid container')
    }
    const canvas = new G.Canvas({
      containerDOM: container,
      width: this.get('width'),
      height: this.get('height'),
      renderer: this.get('renderer'),
      pixelRatio: this.get('pixelRatio')
    })
    this.set('canvas', canvas)
    this._initGroups()
  }
  _initGroups() {
    const canvas = this.get('canvas')
    const id = this.get('canvas').get('el').id
    const group = canvas.addGroup({ id: id + '-root', className: Global.rootContainerClassName })
    if (this.get('groupByTypes')) {
      const edgeGroup = group.addGroup({ id: id + '-edge', className: Global.edgeContainerClassName })
      const nodeGroup = group.addGroup({ id: id + '-node', className: Global.nodeContainerClassName })

      const delegateGroup = group.addGroup({
        id: id + '-delagate',
        className: Global.delegateContainerClassName
      })

      // 用於存儲自定義的群組
      const customGroup = group.addGroup({
        id: `${id}-group`,
        className: Global.customGroupContainerClassName
      })

      customGroup.toBack()

      this.set({ nodeGroup, edgeGroup, customGroup, delegateGroup })
    }
    this.set('group', group)
  }
  _initPlugins() {
    const self = this
    Util.each(self.get('plugins'), plugin => {
      if (!plugin.destroyed && plugin.initPlugin) {
        plugin.initPlugin(self)
      }
    })
  }
  get(key) {
    return this._cfg[key]
  }
  set(key, val) {
    if (Util.isPlainObject(key)) {
      this._cfg = Util.mix({}, this._cfg, key)
    } else {
      this._cfg[key] = val
    }
    return this
  }

  /**
   * 更新元素
   * @param {string|object} item 元素id或元素實例
   * @param {object} cfg 需要更新的數據
   */
  update(item, cfg) {
    this.updateItem(item, cfg)
  }

  /**
   * 更新元素
   * @param {string|object} item 元素id或元素實例
   * @param {object} cfg 需要更新的數據
   */
  updateItem(item, cfg) {
    this.get('itemController').updateItem(item, cfg)
  }

  /**
   * 設置元素狀態
   * @param {string|object} item 元素id或元素實例
   * @param {string} state 狀態
   * @param {boolean} enabled 是否啟用狀態
   */
  setItemState(item, state, enabled) {
    if (Util.isString(item)) {
      item = this.findById(item)
    }
    this.get('itemController').setItemState(item, state, enabled)
    this.get('stateController').updateState(item, state, enabled)
  }

  /**
   * 清理元素多個狀態
   * @param {string|object} item 元素id或元素實例
   * @param {Array|String|null} states 狀態
   */
  clearItemStates(item, states) {
    if (Util.isString(item)) {
      item = this.findById(item)
    }
    this.get('itemController').clearItemStates(item, states)
    if (!states) {
      states = item.get('states')
    }
    this.get('stateController').updateStates(item, states, false)
  }

  /**
   * 新增元素
   * @param {string} type 元素類型(node | edge)
   * @param {object} model 元素數據模型
   * @return {object} 元素實例
   */
  add(type, model) {
    return this.addItem(type, model)
  }

  /**
   * 新增元素 或 節點分組
   * @param {string} type 元素類型(node | edge | group)
   * @param {object} model 元素數據模型
   * @return {object} 元素實例
   */
  addItem(type, model) {
    if (type === 'group') {
      const { groupId, nodes, type, zIndex, title } = model
      let groupTitle = title
      if (isString(title)) {
        groupTitle = {
          text: title
        }
      }
      return this.get('customGroupControll').create(groupId, nodes, type, zIndex, true, groupTitle)
    }
    return this.get('itemController').addItem(type, model)
  }

  /**
   * 刪除元素
   * @param {string|object} item 元素id或元素實例
   */
  remove(item) {
    this.removeItem(item)
  }

  /**
   * 刪除元素
   * @param {string|object} item 元素id或元素實例
   */
  removeItem(item) {
    // 如果item是字符串，且查詢的節點實例不存在，則認為是刪除group
    let nodeItem = null
    if (Util.isString(item)) {
      nodeItem = this.findById(item)
    }

    if (!nodeItem && Util.isString(item)) {
      this.get('customGroupControll').remove(item)
    } else {
      this.get('itemController').removeItem(item)
    }
  }

  /**
   * 設置視圖初始化數據
   * @param {object} data 初始化數據
   */
  data(data) {
    this.set('data', data)
  }

  /**
   * 設置各個節點樣式，以及在各種狀態下節點 keyShape 的樣式。
   * 若是自定義節點切在各種狀態下
   * graph.node(node => {
   *  return {
   *    {
          shape: 'rect',
          label: node.id,
          style: { fill: '#666' },
          stateStyles: {
            selected: { fill: 'blue' },
            custom: { fill: 'green' }
          }
        }
   *  }
   * });
   * @param {function} nodeFn 指定每個節點樣式
   */
  node(nodeFn) {
    if (typeof nodeFn === 'function') {
      this.set('nodeMapper', nodeFn)
    }
  }

  /**
   * 設置各個邊樣式
   * @param {function} edgeFn 指定每個邊的樣式,用法同 node
   */
  edge(edgeFn) {
    if (typeof edgeFn === 'function') {
      this.set('edgeMapper', edgeFn)
    }
  }

  /**
   * 刷新元素
   * @param {string|object} item 元素id或元素實例
   */
  refreshItem(item) {
    this.get('itemController').refreshItem(item)
  }

  /**
   * 當源數據在外部發生變更時，根據新數據刷新視圖。但是不刷新節點位置
   */
  refresh() {
    const self = this
    const autoPaint = self.get('autoPaint')
    self.setAutoPaint(false)
    self.emit('beforegraphrefresh')
    if (self.get('animate')) {
      self.positionsAnimate()
    } else {
      const nodes = self.get('nodes')
      const edges = self.get('edges')
      Util.each(nodes, node => {
        node.refresh()
      })
      Util.each(edges, edge => {
        edge.refresh()
      })
    }
    self.setAutoPaint(autoPaint)
    self.emit('aftergraphrefresh')
    self.autoPaint()
  }

  /**
   * 當節點位置在外部發生改變時，刷新所有節點位置，重計算邊
   */
  refreshPositions() {
    const self = this
    self.emit('beforegraphrefreshposition')
    const nodes = self.get('nodes')
    const edges = self.get('edges')
    let model
    Util.each(nodes, node => {
      model = node.getModel()
      node.updatePosition(model)
    })
    Util.each(edges, edge => {
      edge.refresh()
    })
    self.emit('aftergraphrefreshposition')
    self.autoPaint()
  }

  /**
   * 根據data接口的數據渲染視圖
   */
  render() {
    const self = this
    const data = this.get('data')
    if (!data) {
      throw new Error('data must be defined first')
    }
    this.clear()
    this.emit('beforerender')
    const autoPaint = this.get('autoPaint')
    this.setAutoPaint(false)

    Util.each(data.nodes, node => {
      self.add(NODE, node)
    })
    Util.each(data.edges, edge => {
      self.add(EDGE, edge)
    })

    // 防止傳入的數據不存在nodes
    if (data.nodes) {
      // 獲取所有有groupID的node
      const nodeInGroup = data.nodes.filter(node => node.groupId)

      // 所有node中存在groupID，則說明需要群組
      if (nodeInGroup.length > 0) {
        // 渲染群組
        const groupType = self.get('groupType')
        this.renderCustomGroup(data, groupType)
      }
    }

    if (!this.get('groupByTypes')) {
      // 為提升性能，選擇數量少的進行操作
      if (data.nodes.length < data.edges.length) {
        const nodes = this.getNodes()
        // 遍歷節點實例，將所有節點提前。
        nodes.forEach(node => {
          node.toFront()
        })
      } else {
        const edges = this.getEdges()
        // 遍歷節點實例，將所有節點提前。
        edges.forEach(edge => {
          edge.toBack()
        })
      }
    }

    // layout
    const layoutController = self.get('layoutController')
    if (!layoutController.layout(success)) {
      success()
    }

    function success() {
      if (self.get('fitView')) {
        self.get('viewController')._fitView()
      }
      self.paint()
      self.setAutoPaint(autoPaint)
      self.emit('afterrender')
    }
  }

  /**
   * 根據數據渲染群組
   * @param {object} data 渲染圖的數據
   * @param {string} groupType group類型
   */
  renderCustomGroup(data, groupType) {
    const { groups, nodes } = data

    // 第一種情況，，不存在groups，則不存在嵌套群組
    let groupIndex = 10
    if (!groups) {
      // 存在單個群組
      // 獲取所有有groupID的node
      const nodeInGroup = nodes.filter(node => node.groupId)
      const groupsArr = []
      // 根據groupID分組
      const groupIds = groupBy(nodeInGroup, 'groupId')
      for (const groupId in groupIds) {
        const nodeIds = groupIds[groupId].map(node => node.id)
        this.get('customGroupControll').create(groupId, nodeIds, groupType, groupIndex)
        groupIndex--
        // 獲取所有不重覆的 groupId
        if (!groupsArr.find(data => data.id === groupId)) {
          groupsArr.push({
            id: groupId
          })
        }
      }

      this.set({
        groups: groupsArr
      })
    } else {
      // 將groups的數據存到groups中
      this.set({ groups })

      // 第二種情況，存在嵌套的群組，數據中有groups字段
      const groupNodes = Util.getAllNodeInGroups(data)
      for (const groupId in groupNodes) {
        const tmpNodes = groupNodes[groupId]
        this.get('customGroupControll').create(groupId, tmpNodes, groupType, groupIndex)
        groupIndex--
      }

      // 對所有Group排序
      const customGroup = this.get('customGroup')
      customGroup.sort()
    }
  }

  /**
   * 接收數據進行渲染
   * @Param {Object} data 初始化數據
   */
  read(data) {
    this.data(data)
    this.render()
  }

  /**
   * 更改源數據，根據新數據重新渲染視圖
   * @param {object} data 源數據
   * @return {object} this
   */
  changeData(data) {
    const self = this
    if (!data) {
      return this
    }
    if (!self.get('data')) {
      self.data(data)
      self.render()
    }
    const autoPaint = this.get('autoPaint')
    const itemMap = this.get('itemMap')
    const items = {
      nodes: [],
      edges: []
    }
    this.setAutoPaint(false)
    this._diffItems(NODE, items, data.nodes)
    this._diffItems(EDGE, items, data.edges)
    Util.each(itemMap, (item, id) => {
      if (items.nodes.indexOf(item) < 0 && items.edges.indexOf(item) < 0) {
        delete itemMap[id]
        self.remove(item)
      }
    })
    this.set({ nodes: items.nodes, edges: items.edges })
    const layoutController = this.get('layoutController')
    layoutController.changeData()
    this.setAutoPaint(autoPaint)
    return this
  }
  _diffItems(type, items, models) {
    const self = this
    let item
    const itemMap = this.get('itemMap')
    Util.each(models, model => {
      item = itemMap[model.id]
      if (item) {
        if (self.get('animate') && type === NODE) {
          const containerMatrix = item.getContainer().getMatrix()
          item.set('originAttrs', {
            x: containerMatrix[6],
            y: containerMatrix[7]
          })
        }
        self.updateItem(item, model)
      } else {
        item = self.addItem(type, model)
      }
      items[type + 's'].push(item)
    })
  }

  /**
   * 僅畫布重新繪制
   */
  paint() {
    this.emit('beforepaint')
    this.get('canvas').draw()
    this.emit('afterpaint')
  }

  /**
   * 自動重繪
   * @internal 僅供內部更新機制調用，外部根據需求調用 render 或 paint 接口
   */
  autoPaint() {
    if (this.get('autoPaint')) {
      this.paint()
    }
  }

  /**
   * 導出圖數據
   * @return {object} data
   */
  save() {
    const nodes = []
    const edges = []
    Util.each(this.get('nodes'), node => {
      nodes.push(node.getModel())
    })
    Util.each(this.get('edges'), edge => {
      edges.push(edge.getModel())
    })
    return { nodes, edges, groups: this.get('groups') }
  }

  /**
   * 改變畫布大小
   * @param  {number} width  畫布寬度
   * @param  {number} height 畫布高度
   * @return {object} this
   */
  changeSize(width, height) {
    this.get('viewController').changeSize(width, height)
    this.autoPaint()
    return this
  }

  /**
   * 平移畫布
   * @param {number} dx 水平方向位移
   * @param {number} dy 垂直方向位移
   */
  translate(dx, dy) {
    const group = this.get('group')
    group.translate(dx, dy)
    this.emit('viewportchange', { action: 'translate', matrix: group.getMatrix() })
    this.autoPaint()
  }

  /**
   * 平移畫布到某點
   * @param {number} x 水平坐標
   * @param {number} y 垂直坐標
   */
  moveTo(x, y) {
    const group = this.get('group')
    group.move(x, y)
    this.emit('viewportchange', { action: 'move', matrix: group.getMatrix() })
    this.autoPaint()
  }

  /**
   * 調整視口適應視圖
   * @param {object} padding 四周圍邊距
   */
  fitView(padding) {
    if (padding) {
      this.set('fitViewPadding', padding)
    }
    this.get('viewController')._fitView()
    this.paint()
  }

  /**
   * 新增行為
   * @param {string|array} behaviors 添加的行為
   * @param {string|array} modes 添加到對應的模式
   * @return {object} this
   */
  addBehaviors(behaviors, modes) {
    this.get('modeController').manipulateBehaviors(behaviors, modes, true)
    return this
  }

  /**
   * 移除行為
   * @param {string|array} behaviors 移除的行為
   * @param {string|array} modes 從指定的模式中移除
   * @return {object} this
   */
  removeBehaviors(behaviors, modes) {
    this.get('modeController').manipulateBehaviors(behaviors, modes, false)
    return this
  }

  /**
   * 切換行為模式
   * @param {string} mode 指定模式
   * @return {object} this
   */
  setMode(mode) {
    this.set('mode', mode)
    this.get('modeController').setMode(mode)
    return this
  }

  /**
   * 獲取當前的行為模式
   * @return {string} 當前行為模式
   */
  getCurrentMode() {
    return this.get('mode')
  }

  /**
   * 獲取當前視口伸縮比例
   * @return {number} 比例
   */
  getZoom() {
    return this.get('group').getMatrix()[0]
  }

  /**
   * 獲取當前圖中所有節點的item實例
   * @return {array} item數組
   */
  getNodes() {
    return this.get('nodes')
  }

  /**
   * 獲取當前圖中所有邊的item實例
   * @return {array} item數組
   */
  getEdges() {
    return this.get('edges')
  }

  /**
   * 伸縮視口
   * @param {number} ratio 伸縮比例
   * @param {object} center 以center的x, y坐標為中心縮放
   */
  zoom(ratio, center) {
    const matrix = Util.clone(this.get('group').getMatrix())
    const minZoom = this.get('minZoom')
    const maxZoom = this.get('maxZoom')
    if (center) {
      Util.mat3.translate(matrix, matrix, [-center.x, -center.y])
      Util.mat3.scale(matrix, matrix, [ratio, ratio])
      Util.mat3.translate(matrix, matrix, [center.x, center.y])
    } else {
      Util.mat3.scale(matrix, matrix, [ratio, ratio])
    }
    if (minZoom && matrix[0] < minZoom) {
      return
    }
    if (maxZoom && matrix[0] > maxZoom) {
      return
    }
    this.get('group').setMatrix(matrix)
    this.emit('viewportchange', { action: 'zoom', matrix })
    this.autoPaint()
  }

  /**
   * 伸縮視口到一固定比例
   * @param {number} toRatio 伸縮比例
   * @param {object} center 以center的x, y坐標為中心縮放
   */
  zoomTo(toRatio, center) {
    const ratio = toRatio / this.getZoom()
    this.zoom(ratio, center)
  }

  /**
   * 根據 graph 上的 animateCfg 進行視圖中節點位置動畫接口
   */
  positionsAnimate() {
    const self = this
    self.emit('beforeanimate')
    const animateCfg = self.get('animateCfg')
    const onFrame = animateCfg.onFrame
    const nodes = self.getNodes()
    const toNodes = nodes.map(node => {
      const model = node.getModel()
      return {
        id: model.id,
        x: model.x,
        y: model.y
      }
    })
    if (self.isAnimating()) {
      self.stopAnimate()
    }
    self.get('canvas').animate({
      onFrame(ratio) {
        Util.each(toNodes, data => {
          const node = self.findById(data.id)
          if (!node || node.destroyed) {
            return
          }
          let originAttrs = node.get('originAttrs')
          const model = node.get('model')
          if (!originAttrs) {
            const containerMatrix = node.getContainer().getMatrix()
            originAttrs = {
              x: containerMatrix[6],
              y: containerMatrix[7]
            }
            node.set('originAttrs', originAttrs)
          }
          if (onFrame) {
            const attrs = onFrame(node, ratio, data, originAttrs)
            node.set('model', Util.mix(model, attrs))
          } else {
            model.x = originAttrs.x + (data.x - originAttrs.x) * ratio
            model.y = originAttrs.y + (data.y - originAttrs.y) * ratio
          }
        })
        self.refreshPositions()
      }
    }, animateCfg.duration, animateCfg.easing, () => {
      Util.each(nodes, node => {
        node.set('originAttrs', null)
      })
      if (animateCfg.callback) {
        animateCfg.callback()
      }
      self.emit('afteranimate')
      self.animating = false
    })
  }

  stopAnimate() {
    this.get('canvas').stopAnimate()
  }

  isAnimating() {
    return this.animating
  }

  /**
   * 將元素移動到視口中心
   * @param {string|object} item 指定元素
   */
  focusItem(item) {
    this.get('viewController').focus(item)
    this.autoPaint()
  }

  /**
   * 將屏幕坐標轉換為視口坐標
   * @param {number} clientX 屏幕x坐標
   * @param {number} clientY 屏幕y坐標
   * @return {object} 視口坐標
   */
  getPointByClient(clientX, clientY) {
    return this.get('viewController').getPointByClient(clientX, clientY)
  }

  /**
   * 將視口坐標轉換為屏幕坐標
   * @param {number} x 視口x坐標
   * @param {number} y 視口y坐標
   * @return {object} 視口坐標
   */
  getClientByPoint(x, y) {
    return this.get('viewController').getClientByPoint(x, y)
  }

  /**
   * 將畫布坐標轉換為視口坐標
   * @param {number} canvasX 屏幕x坐標
   * @param {number} canvasY 屏幕y坐標
   * @return {object} 視口坐標
   */
  getPointByCanvas(canvasX, canvasY) {
    return this.get('viewController').getPointByCanvas(canvasX, canvasY)
  }

  /**
   * 將視口坐標轉換為畫布坐標
   * @param {number} x 屏幕x坐標
   * @param {number} y 屏幕y坐標
   * @return {object} 畫布坐標
   */
  getCanvasByPoint(x, y) {
    return this.get('viewController').getCanvasByPoint(x, y)
  }

  /**
   * 顯示元素
   * @param {string|object} item 指定元素
   */
  showItem(item) {
    this.get('itemController').changeItemVisibility(item, true)
  }

  /**
   * 隱藏元素
   * @param {string|object} item 指定元素
   */
  hideItem(item) {
    this.get('itemController').changeItemVisibility(item, false)
  }

  /**
   * 查找對應id的元素
   * @param {string} id 元素id
   * @return {object} 元素實例
   */
  findById(id) {
    return this.get('itemMap')[id]
  }

  /**
   * 根據對應規則查找單個元素
   * @param {string} type 元素類型(node|edge)
   * @param {string} fn 指定規則
   * @return {object} 元素實例
   */
  find(type, fn) {
    let result
    const items = this.get(type + 's')
    Util.each(items, (item, i) => {
      if (fn(item, i)) {
        result = item
        return false
      }
    })
    return result
  }

  /**
   * 查找所有滿足規則的元素
   * @param {string} type 元素類型(node|edge)
   * @param {string} fn 指定規則
   * @return {array} 元素實例
   */
  findAll(type, fn) {
    const result = []
    Util.each(this.get(type + 's'), (item, i) => {
      if (fn(item, i)) {
        result.push(item)
      }
    })
    return result
  }

  /**
   * 查找所有處於指定狀態的元素
   * @param {string} type 元素類型(node|edge)
   * @param {string} state z狀態
   * @return {object} 元素實例
   */
  findAllByState(type, state) {
    return this.findAll(type, item => {
      return item.hasState(state)
    })
  }

  /**
   * 設置是否在更新/刷新後自動重繪
   * @param {boolean} auto 自動重繪
   */
  setAutoPaint(auto) {
    this.set('autoPaint', auto)
  }

  /**
   * 返回圖表的 dataUrl 用於生成圖片
   * @return {string/Object} 圖片 dataURL
   */
  toDataURL() {
    const canvas = this.get('canvas')
    const renderer = canvas.getRenderer()
    const canvasDom = canvas.get('el')
    let dataURL = ''
    if (renderer === 'svg') {
      const clone = canvasDom.cloneNode(true)
      const svgDocType = document.implementation.createDocumentType(
        'svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'
      )
      const svgDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', svgDocType)
      svgDoc.replaceChild(clone, svgDoc.documentElement)
      const svgData = (new XMLSerializer()).serializeToString(svgDoc)
      dataURL = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgData)
    } else if (renderer === 'canvas') {
      dataURL = canvasDom.toDataURL('image/png')
    }
    return dataURL
  }

  /**
   * 畫布導出圖片
   * @param {String} name 圖片的名稱
   */
  downloadImage(name) {
    const self = this
    if (self.isAnimating()) {
      self.stopAnimate()
    }
    const canvas = self.get('canvas')
    const renderer = canvas.getRenderer()
    const fileName = (name || 'graph') + (renderer === 'svg' ? '.svg' : '.png')
    const link = document.createElement('a')
    setTimeout(() => {
      const dataURL = self.toDataURL()
      if (typeof window !== 'undefined') {
        if (window.Blob && window.URL && renderer !== 'svg') {
          const arr = dataURL.split(',')
          const mime = arr[0].match(/:(.*?);/)[1]
          const bstr = atob(arr[1])
          let n = bstr.length
          const u8arr = new Uint8Array(n)
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
          }
          const blobObj = new Blob([u8arr], { type: mime })
          if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(blobObj, fileName)
          } else {
            link.addEventListener('click', function() {
              link.download = fileName
              link.href = window.URL.createObjectURL(blobObj)
            })
          }
        } else {
          link.addEventListener('click', function() {
            link.download = fileName
            link.href = dataURL
          })
        }
      }
      const e = document.createEvent('MouseEvents')
      e.initEvent('click', false, false)
      link.dispatchEvent(e)
    }, 16)
  }

  /**
   * 添加插件
   * @param {object} plugin 插件實例
   */
  addPlugin(plugin) {
    const self = this
    if (plugin.destroyed) {
      return
    }
    self.get('plugins').push(plugin)
    plugin.initPlugin(self)
  }

  /**
   * 添加插件
   * @param {object} plugin 插件實例
   */
  removePlugin(plugin) {
    const plugins = this.get('plugins')
    const index = plugins.indexOf(plugin)
    if (index >= 0) {
      plugin.destroyPlugin()
      plugins.splice(index, 1)
    }
  }

  /**
   * 更換布局配置項
   * @param {object} cfg 新布局配置項
   * 若 cfg 含有 type 字段或為 String 類型，且與現有布局方法不同，則更換布局
   * 若 cfg 不包括 type ，則保持原有布局方法，僅更新布局配置項
   */
  updateLayout(cfg) {
    const layoutController = this.get('layoutController')
    let newLayoutType
    if (Util.isString(cfg)) {
      newLayoutType = cfg
      cfg = {
        type: newLayoutType
      }
    } else {
      newLayoutType = cfg.type
    }
    const oriLayoutCfg = this.get('layout')
    const oriLayoutType = oriLayoutCfg ? oriLayoutCfg.type : undefined
    if (!newLayoutType || oriLayoutType === newLayoutType) {
      // no type or same type, update layout
      const layoutCfg = {}
      Util.mix(layoutCfg, oriLayoutCfg, cfg)
      layoutCfg.type = oriLayoutType || 'random'
      this.set('layout', layoutCfg)
      layoutController.updateLayoutCfg(layoutCfg)
    } else { // has different type, change layout
      this.set('layout', cfg)
      layoutController.changeLayout(newLayoutType)
    }
  }

  /**
   * 重新以當前示例中配置的屬性進行一次布局
   */
  layout() {
    const layoutController = this.get('layoutController')
    const layoutCfg = this.get('layout')

    if (layoutCfg.workerEnabled) {
      // 如果使用web worker布局
      layoutController.layout()
      return
    }
    if (layoutController.layoutMethod) {
      layoutController.relayout()
    } else {
      layoutController.layout()
    }
  }

  /**
   * 清除畫布元素
   * @return {object} this
   */
  clear() {
    const canvas = this.get('canvas')
    canvas.clear()
    this._initGroups()
    // 清空畫布時同時清除數據
    this.set({ itemMap: {}, nodes: [], edges: [], groups: [] })
    return this
  }

  /**
   * 銷毀畫布
   */
  destroy() {
    this.clear()
    Util.each(this.get('plugins'), plugin => {
      plugin.destroyPlugin()
    })
    this.get('eventController').destroy()
    this.get('itemController').destroy()
    this.get('modeController').destroy()
    this.get('viewController').destroy()
    this.get('stateController').destroy()
    this.get('layoutController').destroy()
    this.get('customGroupControll').destroy()
    this.get('canvas').destroy()
    this._cfg = null
    this.destroyed = true
  }

  // group 相關方法
  /**
   * 收起分組
   * @param {string} groupId 分組ID
   */
  collapseGroup(groupId) {
    this.get('customGroupControll').collapseGroup(groupId)
  }

  /**
   * 展開分組
   * @param {string} groupId 分組ID
   */
  expandGroup(groupId) {
    this.get('customGroupControll').expandGroup(groupId)
  }
}

module.exports = Graph
