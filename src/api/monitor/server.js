import request from '@/utils/request'

// 查詢服務器詳細
export function getServer() {
  return request({
    url: '/api/v1/monitor/server',
    method: 'get'
  })
}
