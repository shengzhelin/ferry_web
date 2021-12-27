import request from '@/utils/request'

// 查詢用戶列表
export function listUser(query) {
  return request({
    url: '/api/v1/sysUserList',
    method: 'get',
    params: query
  })
}

// 查詢用戶詳細
export function getUser(userId) {
  return request({
    url: '/api/v1/sysUser/' + userId,
    method: 'get'
  })
}

export function getUserInit() {
  return request({
    url: '/api/v1/sysUser/',
    method: 'get'
  })
}

// 新增用戶
export function addUser(data) {
  return request({
    url: '/api/v1/sysUser',
    method: 'post',
    data: data
  })
}

// 修改用戶
export function updateUser(data) {
  return request({
    url: '/api/v1/sysUser',
    method: 'put',
    data: data
  })
}

// 刪除用戶
export function delUser(userId) {
  return request({
    url: '/api/v1/sysUser/' + userId,
    method: 'delete'
  })
}

// 導出用戶
export function exportUser(query) {
  return request({
    url: '/api/v1/sysUser/export',
    method: 'get',
    params: query
  })
}

// 用戶密碼重置
export function resetUserPwd(userId, password) {
  const data = {
    userId,
    password
  }
  return request({
    url: '/api/v1/sysUser',
    method: 'put',
    data: data
  })
}

// 用戶狀態修改
export function changeUserStatus(userId, status) {
  const data = {
    userId,
    status
  }
  return request({
    url: '/api/v1/sysUser',
    method: 'put',
    data: data
  })
}

// 查詢用戶個人信息
export function getUserProfile() {
  return request({
    url: '/api/v1/user/profile',
    method: 'get'
  })
}

// 修改用戶個人信息
export function updateUserProfile(data) {
  return request({
    url: '/api/v1/sysUser/profile',
    method: 'put',
    data: data
  })
}

// 用戶密碼重置
export function updateUserPwd(oldPassword, newPassword, passwordType) {
  const data = {
    oldPassword,
    newPassword,
    passwordType
  }
  return request({
    url: '/api/v1/user/pwd',
    method: 'put',
    data: data
  })
}

// 用戶頭像上傳
export function uploadAvatar(data) {
  return request({
    url: '/api/v1/user/avatar',
    method: 'post',
    data: data
  })
}

// 下載用戶導入模板
export function importTemplate() {
  return request({
    url: '/api/v1/sysUser/importTemplate',
    method: 'get'
  })
}
