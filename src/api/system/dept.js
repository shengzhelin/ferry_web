import request from '@/utils/request'

export function getDeptList(query) {
  return request({
    url: '/api/v1/deptList',
    method: 'get',
    params: query
  })
}

export function getOrdinaryDeptList(params) {
  return request({
    url: '/api/v1/ordinaryDeptList',
    method: 'get',
    params
  })
}

// 查詢部門詳細
export function getDept(deptId) {
  return request({
    url: '/api/v1/dept/' + deptId,
    method: 'get'
  })
}

// 查詢部門下拉樹結構
export function treeselect() {
  return request({
    url: '/api/v1/deptTree',
    method: 'get'
  })
}

// 根據角色ID查詢部門樹結構
export function roleDeptTreeselect(roleId) {
  return request({
    url: '/api/v1/roleDeptTreeselect/' + roleId,
    method: 'get'
  })
}

// 新增部門
export function addDept(data) {
  return request({
    url: '/api/v1/dept',
    method: 'post',
    data: data
  })
}

// 修改部門
export function updateDept(data) {
  return request({
    url: '/api/v1/dept',
    method: 'put',
    data: data
  })
}

// 刪除部門
export function delDept(deptId) {
  return request({
    url: '/api/v1/dept/' + deptId,
    method: 'delete'
  })
}
