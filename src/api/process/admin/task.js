import request from '@/utils/request'

// 新建任務
export function createTask(data) {
  return request({
    url: '/api/v1/task',
    method: 'post',
    data
  })
}

// 任務列表
export function taskList(params) {
  return request({
    url: '/api/v1/task',
    method: 'get',
    params
  })
}

// 更新任務
export function updateTask(data) {
  return request({
    url: '/api/v1/task',
    method: 'put',
    data
  })
}

// 刪除任務
export function deleteTask(params) {
  return request({
    url: '/api/v1/task',
    method: 'delete',
    params
  })
}

// 任務詳情
export function taskDetails(params) {
  return request({
    url: '/api/v1/task/details',
    method: 'get',
    params
  })
}
