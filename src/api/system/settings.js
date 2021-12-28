import request from '@/utils/request'

// 設置系統配置訊息
export function setSettings(data) {
  return request({
    url: '/api/v1/settings',
    method: 'post',
    data
  })
}

// 獲取系統配置訊息
export function getSettings(params) {
  return request({
    url: '/api/v1/settings',
    method: 'get',
    params
  })
}
