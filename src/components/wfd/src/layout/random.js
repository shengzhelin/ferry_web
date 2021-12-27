/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */

const Layout = require('./layout')
const Util = require('../util/layout')
const Numeric = require('numericjs')

/**
 * mds 布局
 */
Layout.registerLayout('mds', {
  getDefaultCfg() {
    return {
      center: [0, 0], // 布局中心
      linkDistance: 50 // 默認邊長度
    }
  },
  /**
   * 執行布局
   */
  execute() {
    const self = this
    const nodes = self.nodes
    const edges = self.edges
    const center = self.center
    if (nodes.length === 0) return
    else if (nodes.length === 1) {
      nodes[0].x = center[0]
      nodes[0].y = center[1]
    }
    const linkDistance = self.linkDistance
    // the graph-theoretic distance (shortest path distance) matrix
    const adjMatrix = Util.getAdjMatrix({ nodes, edges }, false)
    const distances = Util.floydWarshall(adjMatrix)
    self.handleInfinity(distances)
    self.distances = distances

    // scale the ideal edge length acoording to linkDistance
    const scaledD = Util.scaleMatrix(distances, linkDistance)
    self.scaledDistances = scaledD

    // get positions by MDS
    const positions = self.runMDS()
    self.positions = positions
    positions.forEach((p, i) => {
      nodes[i].x = p[0] + center[0]
      nodes[i].y = p[1] + center[1]
    })
  },
  /**
   * mds 算法
   * @return {array} positions 計算後的節點位置數組
   */
  runMDS() {
    const self = this
    const dimension = 2
    const distances = self.scaledDistances
    // square distances
    const M = Numeric.mul(-0.5, Numeric.pow(distances, 2))
    // double centre the rows/columns
    function mean(A) { return Numeric.div(Numeric.add.apply(null, A), A.length) }
    const rowMeans = mean(M)
    const colMeans = mean(Numeric.transpose(M))
    const totalMean = mean(rowMeans)
    for (let i = 0; i < M.length; ++i) {
      for (let j = 0; j < M[0].length; ++j) {
        M[i][j] += totalMean - rowMeans[i] - colMeans[j]
      }
    }
    // take the SVD of the double centred matrix, and return the
    // points from it
    const ret = Numeric.svd(M)
    const eigenValues = Numeric.sqrt(ret.S)
    return ret.U.map(function(row) {
      return Numeric.mul(row, eigenValues).splice(0, dimension)
    })
  },
  handleInfinity(distances) {
    let maxDistance = -999999
    distances.forEach(row => {
      row.forEach(value => {
        if (value === Infinity) {
          return
        }
        if (maxDistance < value) {
          maxDistance = value/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */

const Layout = require('./layout')

/**
 * 隨機布局
 */
Layout.registerLayout('random', {
  getDefaultCfg() {
    return {
      center: [0, 0], // 布局中心
      height: 300,
      width: 300
    }
  },
  /**
   * 執行布局
   */
  execute() {
    const self = this
    const nodes = self.nodes
    const layoutScale = 0.9
    const center = self.center
    let width = self.width
    if (!width && typeof window !== 'undefined') {
      width = window.innerWidth
    }
    let height = self.height
    if (!height && typeof height !== 'undefined') {
      height = window.innerHeight
    }
    nodes.forEach(node => {
      node.x = (Math.random() - 0.5) * layoutScale * width + center[0]
      node.y = (Math.random() - 0.5) * layoutScale * height + center[1]
    })
  }
})

        }
      })
    })
    distances.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value === Infinity) {
          distances[i][j] = maxDistance
        }
      })
    })
  }
})
