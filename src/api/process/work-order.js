import request from '@/utils/request'

// 流程結構
export function processStructure(params) {
  return request({
    url: '/api/v1/work-order/process-structure',
    method: 'get',
    params
  })
}

// 新建工單
export function createWorkOrder(data) {
  return request({
    url: '/api/v1/work-order/create',
    method: 'post',
    data
  })
}

// 工單列表
export function workOrderList(params) {
  return request({
    url: '/api/v1/work-order/list',
    method: 'get',
    params
  })
}

// 處理工單
export function handleWorkOrder(data) {
  return request({
    url: '/api/v1/work-order/handle',
    method: 'post',
    data
  })
}

// 結束工單
export function unityWorkOrder(params) {
  return request({
    url: '/api/v1/work-order/unity',
    method: 'get',
    params
  })
}

// 轉交工單
export function inversionWorkOrder(data) {
  return request({
    url: '/api/v1/work-order/inversion',
    method: 'post',
    data
  })
}

// 催辦工單
export function urgeWorkOrder(params) {
  return request({
    url: '/api/v1/work-order/urge',
    method: 'get',
    params
  })
}

// 主動接單
export function activeOrder(data, workOrderId) {
  return request({
    url: `/api/v1/work-order/active-order/${workOrderId}`,
    method: 'put',
    data
  })
}

// 刪除工單
export function deleteWorkOrder(workOrderId) {
  return request({
    url: `/api/v1/work-order/delete/${workOrderId}`,
    method: 'delete'
  })
}

// 刪除工單
export function reopenWorkOrder(id) {
  return request({
    url: `/api/v1/work-order/reopen/${id}`,
    method: 'post'
  })
}
