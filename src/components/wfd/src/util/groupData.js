/*
 * @Author: moyee
 * @Date: 2019-07-30 10:39:59
 * @LastEditors: moyee
 * @LastEditTime: 2019-08-20 17:04:25
 * @Description: 群組數據格式轉換
 */
const { cloneDeep, groupBy, merge } = require('lodash')

module.exports = {
  groupMapNodes: {},
  nodeArr: [],
  /**
  * 扁平的數據格式轉成樹形
  * @param {array} data 扁平結構的數據
  * @param {string} value 樹狀結構的唯一標識
  * @param {string} parentId 父節點的鍵值
  * @return {array} 轉成的樹形結構數據
  */
  flatToTree(data, value = 'id', parentId = 'parentId') {
    const children = 'children'
    const valueMap = []
    const tree = []

    const { groups } = data

    groups.forEach(v => {
      valueMap[v[value]] = v
    })

    groups.forEach(v => {
      const parent = valueMap[v[parentId]]
      if (parent) {
        !parent[children] && (parent[children] = [])
        parent[children].push(v)
      } else {
        tree.push(v)
      }
    })

    return tree
  },

  addNodesToParentNode(originData, nodes) {
    const calcNodes = data => {
      data.forEach(row => {
        if (row.children) {
          this.nodeArr.push({
            id: row.id,
            parentId: row.parentId
          })
          this.addNodesToParentNode(row.children, nodes)
        } else {
          this.nodeArr.push({
            id: row.id,
            parentId: row.parentId
          })
        }
      })

      if (this.nodeArr.length > 0) {
        const nodeMap = groupIds => {
          if (groupIds.length === 0) {
            return
          }
          // const selfIds = groupIds.map(node => node.id);
          // const parentIds = groupIds.map(node => node.parentId);
          // const ids = new Set(selfIds);
          // parentIds.forEach(pid => ids.add(pid));

          const first = groupIds.shift()
          const x = cloneDeep(groupIds)
          this.groupMapNodes[first.id] = x
          nodeMap(groupIds)
        }

        nodeMap(this.nodeArr)
      }
      this.nodeArr.length = 0
    }
    calcNodes(originData)
    return this.groupMapNodes
  },

  /**
   * 獲取各個group中的節點
   * @param {object} data G6的數據模型
   * @return {object} 各個group中的節點
   */
  getAllNodeInGroups(data) {
    const groupById = groupBy(data.groups, 'id')
    const groupByParentId = groupBy(data.groups, 'parentId')

    const result = {}
    for (const parentId in groupByParentId) {
      if (!parentId) {
        continue
      }
      // 獲取當前parentId的所有子group ID
      const subGroupIds = groupByParentId[parentId]

      // 獲取在parentid群組中的節點
      const nodeInParentGroup = groupById[parentId]

      if (nodeInParentGroup && subGroupIds) {
        // 合並
        const parentGroupNodes = [...subGroupIds, ...nodeInParentGroup]
        result[parentId] = parentGroupNodes
      } else if (subGroupIds) {
        result[parentId] = subGroupIds
      }
    }
    const allGroupsId = merge({}, groupById, result)

    // 緩存所有group包括的groupID
    const groupIds = {}
    for (const groupId in allGroupsId) {
      if (!groupId || groupId === 'undefined') {
        continue
      }
      const subGroupIds = allGroupsId[groupId].map(node => node.id)

      // const nodesInGroup = data.nodes.filter(node => node.groupId === groupId).map(node => node.id);
      groupIds[groupId] = subGroupIds
    }

    // 緩存所有groupID對應的Node
    const groupNodes = {}
    for (const groupId in groupIds) {
      if (!groupId || groupId === 'undefined') {
        continue
      }

      const subGroupIds = groupIds[groupId]

      // const subGroupIds = allGroupsId[groupId].map(node => node.id);

      // 解析所有子群組
      const parentSubGroupIds = []

      for (const subId of subGroupIds) {
        const tmpGroupId = allGroupsId[subId].map(node => node.id)
        // const tmpNodes = data.nodes.filter(node => node.groupId === subId).map(node => node.id);
        parentSubGroupIds.push(...tmpGroupId)
      }

      const nodesInGroup = data.nodes.filter(node => parentSubGroupIds.indexOf(node.groupId) > -1).map(node => node.id)
      groupNodes[groupId] = nodesInGroup
    }
    return groupNodes
  }
}
