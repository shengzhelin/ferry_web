/**
 * @fileOverview global config
 */

module.exports = {
  version: '3.1.10',
  rootContainerClassName: 'root-container',
  nodeContainerClassName: 'node-container',
  edgeContainerClassName: 'edge-container',
  customGroupContainerClassName: 'custom-group-container',
  delegateContainerClassName: 'delegate-container',
  defaultShapeFillColor: '#91d5ff',
  defaultShapeStrokeColor: '#91d5ff',
  defaultNode: {
    shape: 'circle',
    style: {
      fill: '#fff'
    },
    size: 40,
    color: '#333'
  },
  defaultEdge: {
    shape: 'line',
    style: {},
    size: 1,
    color: '#333'
  },
  nodeLabel: {
    style: {
      fill: '#595959',
      textAlign: 'center',
      textBaseline: 'middle'
    },
    offset: 5 // 節點的默認文本不居中時的偏移量
  },
  edgeLabel: {
    style: {
      fill: '#595959',
      textAlign: 'center',
      textBaseline: 'middle'
    }
  },
  // 節點應用狀態後的樣式，默認僅提供 active 和 selected 用戶可以自己擴展
  nodeStateStyle: {
    active: {
      fillOpacity: 0.8
    },
    selected: {
      lineWidth: 2
    }
  },
  edgeStateStyle: {
    active: {
      strokeOpacity: 0.8
    },
    selected: {
      lineWidth: 2
    }
  },
  loopPosition: 'top',
  delegateStyle: {
    fill: '#F3F9FF',
    fillOpacity: 0.5,
    stroke: '#1890FF',
    strokeOpacity: 0.9,
    lineDash: [5, 5]
  }
}
