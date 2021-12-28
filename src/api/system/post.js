import request from '@/utils/request'

// 查詢職稱列表
export function listPost(query) {
  return request({
    url: '/api/v1/postlist',
    method: 'get',
    params: query
  })
}

// 查詢職稱詳細
export function getPost(postId) {
  return request({
    url: '/api/v1/post/' + postId,
    method: 'get'
  })
}

// 新增職稱
export function addPost(data) {
  return request({
    url: '/api/v1/post',
    method: 'post',
    data: data
  })
}

// 修改職稱
export function updatePost(data) {
  return request({
    url: '/api/v1/post',
    method: 'put',
    data: data
  })
}

// 刪除職稱
export function delPost(postId) {
  return request({
    url: '/api/v1/post/' + postId,
    method: 'delete'
  })
}

