import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import VueI18n from 'vue-i18n'
import VueEditor from 'vue2-editor'

import 'element-ui/lib/theme-chalk/index.css'

import enLocale from 'element-ui/lib/locale/lang/en'
import zhLocale from 'element-ui/lib/locale/lang/zh-TW'

Vue.use(VueI18n)
Vue.use(VueEditor)

const messages = {
  'en-US': {
    header: {
      title: 'FormMaking',
      document: 'Docs',
      pricing: 'Pricing',
      advanced: 'Advanced'
    }
  },
  'zh-TW': {
    header: {
      title: '表單設計器',
      document: '使用文檔',
      pricing: '商業授權',
      advanced: '高級版本'
    }
  }
}

Vue.locale('en-US', { ...enLocale, ...messages['en-US'] })
Vue.locale('zh-TW', { ...zhLocale, ...messages['zh-TW'] })
Vue.config.lang = 'zh-TW'

Vue.use(ElementUI, { size: 'small' })

// import 'form-making/dist/FormMaking.css'
// import FormMaking from 'form-making'
import FormMaking from './index'
Vue.use(FormMaking)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
