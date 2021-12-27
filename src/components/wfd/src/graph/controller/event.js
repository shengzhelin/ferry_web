const Util = require('../../util')

const EVENTS = [
  'click',
  'mousedown',
  'mouseup',
  'dblclick',
  'contextmenu',
  'mouseenter',
  'mouseout',
  'mouseover',
  'mousemove',
  'mouseleave',
  'dragstart',
  'dragend',
  'drag',
  'dragenter',
  'dragleave',
  'drop'
]

function getItemRoot(shape) {
  while (shape && !shape.get('item')) {
    shape = shape.get('parent')
  }
  return shape
}

const ORIGIN_MATRIX = [1, 0, 0, 0, 1, 0, 0, 0, 1]
const MATRIX_LEN = 9

function isViewportChanged(matrix) {
  for (let i = 0; i < MATRIX_LEN; i++) {
    if (matrix[i] !== ORIGIN_MATRIX[i]) {
      return true
    }
  }
  return false
}

class Event {
  constructor(graph) {
    this.graph = graph
    this.extendEvents = []
    this._initEvents()
  }
  _initEvents() {
    const self = this
    const graph = self.graph
    const canvas = graph.get('canvas')
    const el = canvas.get('el')
    const extendEvents = self.extendEvents
    const canvasHandler = Util.wrapBehavior(self, '_onCanvasEvents')
    const originHandler = Util.wrapBehavior(self, '_onExtendEvents')
    const wheelHandler = Util.wrapBehavior(self, '_onWheelEvent')
    Util.each(EVENTS, event => {
      canvas.on(event, canvasHandler)
    })
    this.canvasHandler = canvasHandler
    extendEvents.push(Util.addEventListener(el, 'DOMMouseScroll', wheelHandler))
    extendEvents.push(Util.addEventListener(el, 'mousewheel', wheelHandler))
    if (typeof window !== 'undefined') {
      extendEvents.push(Util.addEventListener(window, 'keydown', originHandler))
      extendEvents.push(Util.addEventListener(window, 'keyup', originHandler))
    }
  }
  _onCanvasEvents(e) {
    const self = this
    const graph = self.graph
    const canvas = graph.get('canvas')
    const pixelRatio = canvas.get('pixelRatio')
    const target = e.target
    const eventType = e.type
    /**
     * (clientX, clientY): 相對於頁面的坐標；
     * (canvasX, canvasY): 相對於 <canvas> 左上角的坐標；
     * (x, y): 相對於整個畫布的坐標, 與 model 的 x, y 是同一維度的。
     */
    e.canvasX = e.x / pixelRatio
    e.canvasY = e.y / pixelRatio
    let point = { x: e.canvasX, y: e.canvasY }
    if (isViewportChanged(graph.get('group').getMatrix())) {
      point = graph.getPointByCanvas(e.canvasX, e.canvasY)
    }
    e.x = point.x
    e.y = point.y
    // 事件currentTarget是graph
    e.currentTarget = graph
    if (target === canvas) {
      if (eventType === 'mousemove') {
        self._handleMouseMove(e, 'canvas')
      }
      e.target = canvas
      e.item = null
      graph.emit(eventType, e)
      graph.emit('canvas:' + eventType, e)
      return
    }
    const itemShape = getItemRoot(target)
    if (!itemShape) {
      graph.emit(eventType, e)
      return
    }
    const item = itemShape.get('item')
    if (item.destroyed) {
      return
    }
    const type = item.getType()
    // 事件target是觸發事件的Shape實例，, item是觸發事件的item實例
    e.target = target
    e.item = item
    graph.emit(eventType, e)
    // g的事件會冒泡，如果target不是canvas，可能會引起同個節點觸發多次，需要另外判斷
    if (eventType === 'mouseenter' || eventType === 'mouseleave' || eventType === 'dragenter' || eventType === 'dragleave') {
      return
    }
    graph.emit(type + ':' + eventType, e)
    if (eventType === 'dragstart') {
      self.dragging = true
    }
    if (eventType === 'dragend') {
      self.dragging = false
    }
    if (eventType === 'mousemove') {
      self._handleMouseMove(e, type)
    }
  }
  _onExtendEvents(e) {
    this.graph.emit(e.type, e)
  }
  _onWheelEvent(e) {
    if (Util.isNil(e.wheelDelta)) {
      e.wheelDelta = -e.detail
    }
    this.graph.emit('wheel', e)
  }
  _handleMouseMove(e, type) {
    const self = this
    const canvas = this.graph.get('canvas')
    const item = e.target === canvas ? null : e.item
    const preItem = this.preItem
    // 避免e的type與觸發的事件不同
    e = Util.cloneEvent(e)
    // 從前一個item直接移動到當前item，觸發前一個item的leave事件
    if (preItem && preItem !== item && !preItem.destroyed) {
      e.item = preItem
      self._emitCustomEvent(preItem.getType(), 'mouseleave', e)
      if (self.dragging) {
        self._emitCustomEvent(preItem.getType(), 'dragleave', e)
      }
    }
    // 從一個item或canvas移動到當前item，觸發當前item的enter事件
    if (item && preItem !== item) {
      e.item = item
      self._emitCustomEvent(type, 'mouseenter', e)
      if (self.dragging) {
        self._emitCustomEvent(type, 'dragenter', e)
      }
    }
    this.preItem = item
  }
  _emitCustomEvent(itemType, type, e) {
    e.type = type
    this.graph.emit(itemType + ':' + type, e)
  }
  destroy() {
    const graph = this.graph
    const canvasHandler = this.canvasHandler
    const canvas = graph.get('canvas')
    Util.each(EVENTS, event => {
      canvas.off(event, canvasHandler)
    })
    Util.each(this.extendEvents, event => {
      event.remove()
    })
  }
}

module.exports = Event
