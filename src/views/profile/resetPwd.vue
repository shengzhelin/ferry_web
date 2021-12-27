<template>
  <el-form ref="form" :model="user" :rules="rules" label-width="80px">
    <el-form-item label="舊密碼" prop="oldPassword">
      <el-input v-model="user.oldPassword" placeholder="請輸入舊密碼" type="password" />
    </el-form-item>
    <el-form-item label="新密碼" prop="newPassword">
      <el-input v-model="user.newPassword" placeholder="請輸入新密碼" type="password" />
    </el-form-item>
    <el-form-item label="確認密碼" prop="confirmPassword" style="/* margin-bottom: 10px */">
      <el-input v-model="user.confirmPassword" placeholder="請確認密碼" type="password" />
    </el-form-item>
    <!-- <el-form-item style="margin-bottom: 5px">
      <el-checkbox v-model="passwordTyleStatus">LDAP密碼</el-checkbox>
    </el-form-item> -->
    <el-form-item>
      <el-button type="primary" size="mini" @click="submit">保存</el-button>
      <el-button type="danger" size="mini" @click="close">關閉</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { updateUserPwd } from '@/api/system/sysuser'

export default {
  data() {
    const equalToPassword = (rule, value, callback) => {
      if (this.user.newPassword !== value) {
        callback(new Error('兩次輸入的密碼不一致'))
      } else {
        callback()
      }
    }
    return {
      passwordTyleStatus: true,
      user: {
        oldPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined,
        passwordType: 1
      },
      // 表單校驗
      rules: {
        oldPassword: [
          { required: true, message: '舊密碼不能為空', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '新密碼不能為空', trigger: 'blur' },
          { min: 6, max: 20, message: '長度在 6 到 20 個字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '確認密碼不能為空', trigger: 'blur' },
          { required: true, validator: equalToPassword, trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submit() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (!this.passwordTyleStatus) {
            this.user.passwordType = 0
          }
          this.user.passwordType = 0
          updateUserPwd(this.user.oldPassword, this.user.newPassword, this.user.passwordType).then(
            response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
              } else {
                this.msgError(response.msg)
              }
            }
          )
        }
      })
    },
    close() {
      this.$store.dispatch('tagsView/delView', this.$route)
      this.$router.push({ path: '/index' })
    }
  }
}
</script>
