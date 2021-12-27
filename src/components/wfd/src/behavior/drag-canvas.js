const Util = require('../util')
const abs = Math.abs
const DRAG_OFFSET = 10
const body = document.body
const ALLOW_EVENTS = [16, 17, 18]

module.exports = {
  getDefaultCfg() {
    return {
      direction: 'both'
    }
  },
  getEvents() {
    return {
      'canvas:mousedown': 'onMouseDown',
      'canvas:mousemove': 'onMouseMove',
      'canvas:mouseup': 'onMouseUp',
      'canvas:click': 'onMouseUp',
      'canvas:mouseleave': 'onOutOfRange',
      keyup: 'onKeyUp',
      keydown: 'onKeyDown'
    }
  },
  updateViewport(e) {
    const origin = this.origin
    const clientX = +e.clientX
    const clientY = +e.clientY
    if (isNaN(clientX) || isNaN(clientY)) {
      return
    }
    let dx = clientX - origin.x
    let dy = clientY - origin.y
    if (this.get('direction') === 'x') {
      dy = 0
    } else if (this.get('direction') === 'y') {
      dx = 0
    }
    this.origin = {
      x: clientX,
      y: clientY
    }
    this.graph.translate(dx, dy)
    this.graph.paint()
  },
  onMouseDown(e) {
    if (this.keydown) {
      return
    }

    this.origin = { x: e.clientX, y: e.clientY }
    this.dragging = false
  },
  onMouseMove(e) {
    if (this.keydown) {
      return
    }

    e = Util.cloneEvent(e)
    const graph = this.graph
    if (!this.origin) { return }
    if (this.origin && !this.dragging) {
      if (abs(this.origin.x - e.clientX) + abs(this.origin.y - e.clientY) < DRAG_OFFSET) {
        return
      }
      // eslint-disable-next-line no-useless-call
      if (this.shouldBegin.call(this, e)) {
        e.type = 'dragstart'
        graph.emit('canvas:dragstart', e)
        this.dragging = true
      }
    }
    if (this.dragging) {
      e.type = 'drag'
      graph.emit('canvas:drag', e)
    }
    // eslint-disable-next-line no-useless-call
    if (this.shouldUpdate.call(this, e)) {
      this.updateViewport(e)
    }
  },
  onMouseUp(e) {
    if (this.keydown) {
      return
    }

    if (!this.dragging) {
      this.origin = null
      return
    }
    e = Util.cloneEvent(e)
    const graph = this.graph
    // eslint-disable-next-line no-useless-call
    if (this.shouldEnd.call(this, e)) {
      this.updateViewport(e)
    }
    e.type = 'dragend'
    graph.emit('canvas:dragend', e)
    this.endDrag()
  },
  endDrag() {
    if (this.dragging) {
      this.origin = null
      this.dragging = false
      // 終止時需要判斷此時是否在監聽畫布外的 mouseup 事件，若有則解綁
      const fn = this.fn
      if (fn) {
        body.removeEventListener('mouseup', fn, false)
        this.fn = null
      }
    }
  },
  // 若在拖拽時，鼠標移出畫布區域，此時放開鼠標無法終止 drag 行為。在畫布外監聽 mouseup 事件，放開則終止
  onOutOfRange(e) {
    if (this.dragging) {
      const self = this
      const canvasElement = self.graph.get('canvas').get('el')
      const fn = ev => {
        if (ev.target !== canvasElement) {
          self.onMouseUp(e)
        }
      }
      this.fn = fn
      body.addEventListener('mouseup', fn, false)
    }
  },
  onKeyDown(e) {
    const code = e.keyCode || e.which
    if (ALLOW_EVENTS.indexOf(code) > -1) {
      this.keydown = true
    } else {
      this.keydown = false
    }
  },
  onKeyUp() {
    this.keydown = false
  }
}
