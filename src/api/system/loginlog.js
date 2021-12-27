import request from '@/utils/request'

// 查詢登錄日志列表
export function list(query) {
  return request({
    url: '/api/v1/loginloglist',
    method: 'get',
    params: query
  })
}

// 刪除登錄日志
export function delLogininfor(infoId) {
  return request({
    url: '/api/v1/loginlog/' + infoId,
    method: 'delete'
  })
}

// 清空登錄日志
export function cleanLogininfor() {
  return request({
    url: '/api/v1/loginlog',
    method: 'delete'
  })
}

// 導出登錄日志
export function exportLogininfor(query) {
  return request({
    url: '/api/v1/loginlog/export',
    method: 'get',
    params: query
  })
}
