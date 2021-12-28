<template>
  <router-view />
</template>

<script>
import Vue from 'vue'

export default {
  watch: {
    '$route.params.lang': function(val) {
      this.loadLanguage()
    }
  },
  created() {
    this.loadLanguage()
  },
  methods: {
    loadLanguage() {
      if (this.$route.params.lang === 'zh-TW') {
        Vue.config.lang = 'zh-TW'
        localStorage.setItem('language', 'zh-TW')
      } else if (this.$route.params.lang === 'en-US') {
        Vue.config.lang = 'en-US'
        localStorage.setItem('language', 'en-US')
      } else {
        this.$router.replace({ name: this.$route.name, params: { lang: navigator.language === 'zh-TW' ? 'zh-TW' : 'en-US' }})
      }
    }
  }
}
</script>
