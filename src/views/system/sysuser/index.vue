<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!--部門數據-->
      <el-col :span="4" :xs="24" style="padding-right: 0;">
        <el-card class="box-card">
          <div class="head-container">
            <el-input
              v-model="deptName"
              placeholder="請輸入部門名稱"
              clearable
              size="small"
              prefix-icon="el-icon-search"
              style="margin-bottom: 20px"
            />
          </div>
          <div class="head-container">
            <el-tree
              ref="tree"
              :data="deptOptions"
              :props="defaultProps"
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              default-expand-all
              @node-click="handleNodeClick"
            />
          </div>
        </el-card>
      </el-col>
      <!--用戶數據-->
      <el-col :span="20" :xs="24">
        <el-card class="box-card">
          <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
            <el-form-item label="用戶帳號" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="請輸入用戶帳號"
                clearable
                size="small"
                style="width: 240px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="手機號碼" prop="phone">
              <el-input
                v-model="queryParams.phone"
                placeholder="請輸入手機號碼"
                clearable
                size="small"
                style="width: 240px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                v-permisaction="['system:sysuser:add']"
                type="primary"
                icon="el-icon-plus"
                size="mini"
                @click="handleAdd"
              >新增</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-permisaction="['system:sysuser:edit']"
                type="success"
                icon="el-icon-edit"
                size="mini"
                :disabled="single"
                @click="handleUpdate"
              >編輯</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-permisaction="['system:sysuser:remove']"
                type="danger"
                icon="el-icon-delete"
                size="mini"
                :disabled="multiple"
                @click="handleDelete"
              >刪除</el-button>
            </el-col>
          </el-row>

          <el-table
            v-loading="loading"
            :data="userList"
            border
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column label="編號" width="50" align="center" prop="userId" />
            <el-table-column label="用戶帳號" align="center" prop="username" :show-overflow-tooltip="true" />
            <el-table-column label="用戶名稱" align="center" prop="nickName" :show-overflow-tooltip="true" />
            <el-table-column label="部門" align="center" prop="deptName" :show-overflow-tooltip="true" />
            <el-table-column label="手機號碼" align="center" prop="phone" width="120" />
            <el-table-column label="狀態" width="68" align="center">
              <template slot-scope="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-value="0"
                  inactive-value="1"
                  @change="handleStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="創建時間" align="center" prop="create_time" width="165">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.create_time) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="220"
              class-name="small-padding fixed-width"
            >
              <template slot-scope="scope">
                <el-button
                  v-permisaction="['system:sysuser:edit']"
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleUpdate(scope.row)"
                >編輯</el-button>
                <el-button
                  v-if="scope.row.username !== 'admin'"
                  v-permisaction="['system:sysuser:remove']"
                  size="mini"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                >刪除</el-button>
                <el-button
                  v-permisaction="['system:sysuser:resetPassword']"
                  size="mini"
                  type="text"
                  icon="el-icon-key"
                  @click="handleResetPwd(scope.row)"
                >重置</el-button>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageIndex"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加或修改參數配置對話框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用戶帳號" prop="username" style="width: 90%">
              <el-input v-model="form.username" placeholder="請輸入用戶帳號" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用戶名稱" prop="nickName" style="width: 90%">
              <el-input v-model="form.nickName" placeholder="請輸入用戶名稱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用戶密碼" prop="password" style="width: 90%">
              <el-input v-model="form.password" placeholder="請輸入用戶密碼" type="password" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手機號碼" prop="phone" style="width: 90%">
              <el-input v-model="form.phone" placeholder="請輸入手機號碼" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信箱" prop="email" style="width: 90%">
              <el-input v-model="form.email" placeholder="請輸入信箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" style="width: 90%">
              <el-select v-model="form.roleId" placeholder="請選擇" style="width: 100%" @change="$forceUpdate()">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status == 1"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="歸屬部門" prop="deptId" style="width: 90%">
              <treeselect
                v-model="form.deptId"
                :options="deptOptions"
                :normalizer="normalizer"
                placeholder="請選擇歸屬部門"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="職稱" style="width: 90%">
              <el-select v-model="form.postId" placeholder="請選擇" style="width: 100%" @change="$forceUpdate()">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status == 1"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="備註" style="width: 95%">
              <el-input v-model="form.remark" type="textarea" placeholder="請輸入內容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">確 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 用戶導入對話框 -->
    <el-dialog :title="upload.title" :visible.sync="upload.open" width="400px">
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload" />
        <div class="el-upload__text">
          將文件拖到此處，或
          <em>點擊上傳</em>
        </div>
        <div slot="tip" class="el-upload__tip">
          <el-checkbox v-model="upload.updateSupport" />是否更新已經存在的用戶數據
          <el-link type="info" style="font-size:12px" @click="importTemplate">下載模板</el-link>
        </div>
        <div slot="tip" class="el-upload__tip" style="color:red">提示：僅允許導入“xls”或“xlsx”格式文件！</div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">確 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listUser, getUser, delUser, addUser, updateUser, exportUser, resetUserPwd, changeUserStatus, importTemplate, getUserInit } from '@/api/system/sysuser'
import { getToken } from '@/utils/auth'
import { treeselect } from '@/api/system/dept'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

export default {
  name: 'User',
  components: { Treeselect },
  data() {
    return {
      // 遮罩層
      loading: true,
      // 選中數組
      ids: [],
      // 非單個禁用
      single: true,
      // 非多個禁用
      multiple: true,
      // 總條數
      total: 0,
      // 用戶表格數據
      userList: null,
      // 彈出層標題
      title: '',
      // 部門樹選項
      deptOptions: undefined,
      // 是否顯示彈出層
      open: false,
      // 部門名稱
      deptName: undefined,
      // 日期範圍
      dateRange: [],
      // 職稱選項
      postOptions: [],
      // 角色選項
      roleOptions: [],
      // 表單參數
      form: {},
      defaultProps: {
        children: 'children',
        label: 'deptName'
      },
      // 用戶導入參數
      upload: {
        // 是否顯示彈出層（用戶導入）
        open: false,
        // 彈出層標題（用戶導入）
        title: '',
        // 是否禁用上傳
        isUploading: false,
        // 是否更新已經存在的用戶數據
        updateSupport: 0,
        // 設置上傳的請求頭部
        headers: { Authorization: 'Bearer ' + getToken() },
        // 上傳的地址
        url: process.env.VUE_APP_BASE_API + '/system/user/importData'
      },
      // 查詢參數
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        username: undefined,
        phone: undefined,
        status: undefined,
        deptId: undefined
      },
      // 表單校驗
      rules: {
        username: [
          { required: true, message: '用戶帳號不能為空', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: '用戶名稱不能為空', trigger: 'blur' }
        ],
        deptId: [
          { required: true, message: '歸屬部門不能為空', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '用戶密碼不能為空', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '信箱地址不能為空', trigger: 'blur' },
          {
            type: 'email',
            message: "'請輸入正確的信箱地址",
            trigger: ['blur', 'change']
          }
        ],
        phone: [
          { required: true, message: '手機號碼不能為空', trigger: 'blur' },
          {
            pattern: /^0[9][0-9]\d{7}$/,
            message: '請輸入正確的手機號碼',
            trigger: 'blur'
          }
        ]
      }
    }
  },
  watch: {
    // 根據名稱篩選部門樹
    deptName(val) {
      this.$refs.tree.filter(val)
    }
  },
  created() {
    this.getList()
    this.getTreeselect()
  },
  methods: {
    /** 查詢用戶列表 */
    getList() {
      this.loading = true
      listUser(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.userList = response.data.list
        this.total = response.data.count
        this.loading = false
      }
      )
    },
    /** 查詢部門下拉樹結構 */
    getTreeselect() {
      treeselect().then(response => {
        this.deptOptions = response.data
      })
    },
    // 篩選節點
    filterNode(value, data) {
      if (!value) return true
      return data.deptName.indexOf(value) !== -1
    },
    // 節點單擊事件
    handleNodeClick(data) {
      this.queryParams.deptId = data.deptId
      this.getList()
    },
    /** 轉換選單數據結構 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return {
        id: node.deptId,
        label: node.deptName,
        children: node.children
      }
    },
    // 用戶狀態修改
    handleStatusChange(row) {
      const text = row.status === '0' ? '啟用' : '停用'
      this.$confirm('確認要"' + text + '""' + row.username + '"用戶嗎?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return changeUserStatus(row.userId, row.status)
      }).then(() => {
        this.msgSuccess(text + '成功')
      }).catch(function() {
        row.status = row.status === '0' ? '1' : '0'
      })
    },
    // 取消按鈕
    cancel() {
      this.open = false
      this.reset()
    },
    // 表單重置
    reset() {
      this.form = {
        userId: undefined,
        deptId: undefined,
        username: undefined,
        nickName: undefined,
        password: undefined,
        phone: undefined,
        email: undefined,
        sex: undefined,
        status: '0',
        remark: undefined,
        postIds: undefined,
        roleIds: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按鈕操作 */
    handleQuery() {
      this.queryParams.page = 1
      this.getList()
    },
    /** 重置按鈕操作 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    // 多選框選中數據
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按鈕操作 */
    handleAdd() {
      this.reset()
      this.getTreeselect()
      getUserInit().then(response => {
        this.postOptions = response.data.posts
        this.roleOptions = response.data.roles
        this.open = true
        this.title = '添加用戶'
        this.form.password = '123456'
      })
    },
    /** 修改按鈕操作 */
    handleUpdate(row) {
      this.reset()
      this.getTreeselect()

      const userId = row.userId || this.ids
      getUser(userId).then(response => {
        this.form = response.data
        this.postOptions = response.posts
        this.roleOptions = response.roles
        this.form.postIds = response.postIds[0]
        this.form.roleIds = response.roleIds[0]
        this.open = true
        this.title = '修改用戶'
        this.form.password = ''
      })
    },
    /** 重置密碼按鈕操作 */
    handleResetPwd(row) {
      this.$prompt('請輸入"' + row.username + '"的新密碼', '提示', {
        confirmButtonText: '確定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        resetUserPwd(row.userId, value).then(response => {
          if (response.code === 200) {
            this.msgSuccess('修改成功，新密碼是：' + value)
          } else {
            this.msgError(response.msg)
          }
        })
      }).catch(() => {})
    },
    /** 提交按鈕 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.userId !== undefined) {
            updateUser(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addUser(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('新增成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          }
        }
      })
    },
    /** 刪除按鈕操作 */
    handleDelete(row) {
      const userIds = row.userId || this.ids
      this.$confirm('是否確認刪除用戶編號為"' + userIds + '"的數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delUser(userIds)
      }).then(() => {
        this.getList()
        this.msgSuccess('刪除成功')
      }).catch(function() {})
    },
    /** 導出按鈕操作 */
    handleExport() {
      const queryParams = this.queryParams
      this.$confirm('是否確認導出所有用戶數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return exportUser(queryParams)
      }).then(response => {
        this.download(response.msg)
      }).catch(function() {})
    },
    /** 導入按鈕操作 */
    handleImport() {
      this.upload.title = '用戶導入'
      this.upload.open = true
    },
    /** 下載模板操作 */
    importTemplate() {
      importTemplate().then(response => {
        this.download(response.msg)
      })
    },
    // 文件上傳中處理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true
    },
    // 文件上傳成功處理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false
      this.upload.isUploading = false
      this.$refs.upload.clearFiles()
      this.$alert(response.msg, '導入結果', { dangerouslyUseHTMLString: true })
      this.getList()
    },
    // 提交上傳文件
    submitFileForm() {
      this.$refs.upload.submit()
    }
  }
}
</script>
