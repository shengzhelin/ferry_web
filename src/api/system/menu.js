import request from '@/utils/request'

// 查詢選單列表
export function listMenu(query) {
  return request({
    url: '/api/v1/menulist',
    method: 'get',
    params: query
  })
}

// 查詢選單詳細
export function getMenu(menuId) {
  return request({
    url: '/api/v1/menu/' + menuId,
    method: 'get'
  })
}

// 查詢選單下拉樹結構
export function treeselect() {
  return request({
    url: '/api/v1/menuTreeselect',
    method: 'get'
  })
}

// 根據角色ID查詢選單下拉樹結構
export function roleMenuTreeselect(roleId) {
  return request({
    url: '/api/v1/roleMenuTreeselect/' + roleId,
    method: 'get'
  })
}

// 新增選單
export function addMenu(data) {
  return request({
    url: '/api/v1/menu',
    method: 'post',
    data: data
  })
}

// 修改選單
export function updateMenu(data) {
  return request({
    url: '/api/v1/menu',
    method: 'put',
    data: data
  })
}

// 刪除選單
export function delMenu(menuId) {
  return request({
    url: '/api/v1/menu/' + menuId,
    method: 'delete'
  })
}
