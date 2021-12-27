import request from '@/utils/request'

// 創建流程分類
export function createClassify(data) {
  return request({
    url: '/api/v1/classify',
    method: 'post',
    data
  })
}

// 流程分類列表
export function classifyList(params) {
  return request({
    url: '/api/v1/classify',
    method: 'get',
    params
  })
}

// 更新流程分類
export function updateClassify(data) {
  return request({
    url: '/api/v1/classify',
    method: 'put',
    data
  })
}

// 刪除流程分類
export function deleteClassify(params) {
  return request({
    url: '/api/v1/classify',
    method: 'delete',
    params
  })
}
