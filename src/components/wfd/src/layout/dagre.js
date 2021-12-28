/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */

const dagre = require('dagre')
const Layout = require('./layout')
const isArray = require('@antv/util/lib/type/is-array')

/**
 * 隨機佈局
 */
Layout.registerLayout('dagre', {
  getDefaultCfg() {
    return {
      rankdir: 'TB', // layout 方向, 可選 TB, BT, LR, RL
      align: undefined, // 節點對齊方式，可選 UL, UR, DL, DR
      nodeSize: undefined, // 節點大小
      nodesepFunc() { return 50 }, // 節點水平間距(px)
      ranksepFunc() { return 50 }, // 每一層節點之間間距
      nodesep: 50, // 節點水平間距(px)
      ranksep: 50, // 每一層節點之間間距
      controlPoints: true // 是否保留佈局連線的控制點
    }
  },
  /**
   * 執行佈局
   */
  execute() {
    const self = this
    const nodes = self.nodes
    const edges = self.edges
    const g = new dagre.graphlib.Graph()
    const nodeSize = self.nodeSize
    let nodeSizeFunc
    if (!nodeSize) {
      nodeSizeFunc = d => {
        if (d.size) {
          if (isArray(d.size)) {
            return d.size
          }
          return [d.size, d.size]
        }
        return [40, 40]
      }
    } else if (isArray(nodeSize)) {
      nodeSizeFunc = () => {
        return nodeSize
      }
    } else {
      nodeSizeFunc = () => {
        return [nodeSize, nodeSize]
      }
    }
    let horisep = self.nodesep
    if (self.nodesepFunc) horisep = self.nodesepFunc
    let vertisep = self.ranksep
    if (self.ranksepFunc) vertisep = self.ranksepFunc
    const rankdir = self.rankdir
    if (rankdir === 'LR' || rankdir === 'RL') {
      horisep = self.ranksep
      if (self.ranksepFunc) horisep = self.ranksepFunc
      vertisep = self.nodesep
      if (self.nodesepFunc) vertisep = self.nodesepFunc
    }
    g.setDefaultEdgeLabel(function() { return {} })
    g.setGraph(self)
    nodes.forEach(node => {
      const size = nodeSizeFunc(node)
      const hori = horisep(node)
      const verti = vertisep(node)
      const width = size[0] + 2 * hori
      const height = size[1] + 2 * verti
      g.setNode(node.id, { width, height })
    })
    edges.forEach(edge => {
      g.setEdge(edge.source, edge.target)
    })
    dagre.layout(g)
    let coord
    g.nodes().forEach((node, i) => {
      coord = g.node(node)
      nodes[i].x = coord.x
      nodes[i].y = coord.y
    })
    g.edges().forEach((edge, i) => {
      coord = g.edge(edge)
      edges[i].startPoint = coord.points[0]
      edges[i].endPoint = coord.points[coord.points.length - 1]
      if (self.controlPoints) {
        edges[i].controlPoints = coord.points.slice(1, coord.points.length - 1)
      }
    })
  }
})
