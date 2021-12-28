import request from '@/utils/request'

// 查詢登入日誌列表
export function list(query) {
  return request({
    url: '/api/v1/loginloglist',
    method: 'get',
    params: query
  })
}

// 刪除登入日誌
export function delLogininfor(infoId) {
  return request({
    url: '/api/v1/loginlog/' + infoId,
    method: 'delete'
  })
}

// 清空登入日誌
export function cleanLogininfor() {
  return request({
    url: '/api/v1/loginlog',
    method: 'delete'
  })
}

// 導出登入日誌
export function exportLogininfor(query) {
  return request({
    url: '/api/v1/loginlog/export',
    method: 'get',
    params: query
  })
}
