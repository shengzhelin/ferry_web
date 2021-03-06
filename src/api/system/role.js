import request from '@/utils/request'

// 查詢角色列表
export function listRole(query) {
  return request({
    url: '/api/v1/rolelist',
    method: 'get',
    params: query
  })
}

// 查詢角色詳細
export function getRole(roleId) {
  return request({
    url: '/api/v1/role/' + roleId,
    method: 'get'
  })
}

// 新增角色
export function addRole(data) {
  return request({
    url: '/api/v1/role',
    method: 'post',
    data: data
  })
}

// 修改角色
export function updateRole(data) {
  return request({
    url: '/api/v1/role',
    method: 'put',
    data: data
  })
}

// 角色數據權限
export function dataScope(data) {
  return request({
    url: '/api/v1/roledatascope',
    method: 'put',
    data: data
  })
}

// 角色狀態修改
export function changeRoleStatus(roleId, status) {
  const data = {
    roleId,
    status
  }
  return request({
    url: '/api/v1/role',
    method: 'put',
    data: data
  })
}

// 刪除角色
export function delRole(roleId) {
  return request({
    url: '/api/v1/role/' + roleId,
    method: 'delete'
  })
}

export function getListrole(id) {
  return request({
    url: '/api/v1/menu/role/' + id,
    method: 'get'
  })
}

export function getRoutes() {
  return request({
    url: '/api/v1/menurole',
    method: 'get'
  })
}

export function getMenuNames() {
  return request({
    url: '/api/v1/menuids',
    method: 'get'
  })
}
