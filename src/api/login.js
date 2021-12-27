import request from '@/utils/request'

// 獲取驗證碼
export function getCodeImg() {
  return request({
    url: '/api/v1/getCaptcha',
    method: 'get'
  })
}
