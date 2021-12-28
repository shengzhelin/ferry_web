import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config
  },
  error => {
    // do something with request error
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const code = response.data.code
    if (code === 401) {
      store.dispatch('user/resetToken')
      if (location.href.indexOf('login') !== -1) {
        location.reload() // 為了重新實例化vue-router對象 避免bug
      } else {
        MessageBox.confirm(
          '登入狀態已過期，您可以繼續留在該頁面，或者重新登入',
          '系統提示',
          {
            confirmButtonText: '重新登入',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          location.reload() // 為了重新實例化vue-router對象 避免bug
        })
      }
    } else if (code === 6401) {
      store.dispatch('user/resetToken')
      MessageBox.confirm(
        '登入狀態已過期，您可以繼續留在該頁面，或者重新登入',
        '系統提示',
        {
          confirmButtonText: '重新登入',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        location.reload() // 為了重新實例化vue-router對象 避免bug
      })
      return false
    } else if (code === 400 || code === 403 || code !== 200) {
      Message({
        message: response.data.msg,
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject('error')
    } else {
      return response.data
    }
  },
  error => {
    if (error.message === 'Network Error') {
      Message({
        message: '服務器連接異常，請檢查服務器！',
        type: 'error',
        duration: 5 * 1000
      })
      return
    }

    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(error)
  }
)

export default service
