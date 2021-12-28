<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form ref="queryForm" :model="queryParams" :inline="true">
        <el-form-item label="角色名稱" prop="roleName">
          <el-input
            v-model="queryParams.roleName"
            placeholder="請輸入角色名稱"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="權限字符" prop="roleKey">
          <el-input
            v-model="queryParams.roleKey"
            placeholder="請輸入權限字符"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <!-- <el-form-item label="創建時間">
        <el-date-picker
          v-model="dateRange"
          size="small"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="開始日期"
          end-placeholder="結束日期"
        />
      </el-form-item> -->
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysrole:add']"
            type="primary"
            icon="el-icon-plus"
            size="mini"
            @click="handleAdd"
          >新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysrole:edit']"
            type="success"
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
          >編輯</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysrole:remove']"
            type="danger"
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
          >刪除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysrole:export']"
            type="warning"
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
          >導出</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" border :data="roleList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="角色編號" prop="roleId" width="120" />
        <el-table-column label="角色名稱" prop="roleName" :show-overflow-tooltip="true" width="150" />
        <el-table-column label="權限字符" prop="roleKey" :show-overflow-tooltip="true" width="150" />
        <el-table-column label="顯示順序" prop="roleSort" width="100" />
        <el-table-column label="狀態" align="center" width="100">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="創建時間" align="center" prop="create_time" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.create_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['system:sysrole:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
            >編輯</el-button>
            <el-button
              v-permisaction="['system:sysrole:remove']"
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >刪除</el-button>
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

      <!-- 添加或修改角色配置對話框 -->
      <el-dialog :title="title" :visible.sync="open" width="500px">
        <el-form ref="form" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="角色名稱" prop="roleName">
            <el-input v-model="form.roleName" placeholder="請輸入角色名稱" :disabled="isEdit" />
          </el-form-item>
          <el-form-item label="權限字符" prop="roleKey">
            <el-input v-model="form.roleKey" placeholder="請輸入權限字符" :disabled="isEdit" />
          </el-form-item>
          <el-form-item label="角色順序" prop="roleSort">
            <el-input-number v-model="form.roleSort" controls-position="right" :min="0" />
          </el-form-item>
          <el-form-item label="選單權限">
            <el-tree
              ref="menu"
              :data="menuOptions"
              show-checkbox
              node-key="id"
              empty-text="加載中，請稍後"
              :props="defaultProps"
            />
          </el-form-item>
          <el-form-item label="備註">
            <el-input v-model="form.remark" type="textarea" placeholder="請輸入內容" />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="submitForm">確 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </el-dialog>

      <!-- 分配角色數據權限對話框 -->
      <el-dialog :title="title" :visible.sync="openDataScope" width="500px">
        <el-form :model="form" label-width="80px">
          <el-form-item label="角色名稱">
            <el-input v-model="form.roleName" :disabled="true" />
          </el-form-item>
          <el-form-item label="權限字符">
            <el-input v-model="form.roleKey" :disabled="true" />
          </el-form-item>
          <el-form-item label="權限範圍">
            <el-select v-model="form.dataScope">
              <el-option
                v-for="item in dataScopeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-show="form.dataScope == 2" label="數據權限">
            <el-tree
              ref="dept"
              :data="deptOptions"
              show-checkbox
              default-expand-all
              node-key="id"
              empty-text="加載中，請稍後"
              :props="defaultProps"
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="submitDataScope">確 定</el-button>
          <el-button @click="cancelDataScope">取 消</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { listRole, getRole, delRole, addRole, updateRole, dataScope, changeRoleStatus } from '@/api/system/role'
import { treeselect as menuTreeselect, roleMenuTreeselect } from '@/api/system/menu'
import { treeselect as deptTreeselect, roleDeptTreeselect } from '@/api/system/dept'
import { formatJson } from '@/utils'

export default {
  name: 'Role',
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
      // 角色表格數據
      roleList: [],
      // 彈出層標題
      title: '',
      // 是否顯示彈出層
      open: false,
      // 是否顯示彈出層（數據權限）
      openDataScope: false,
      isEdit: false,
      // 日期範圍
      dateRange: [],
      // 數據範圍選項
      dataScopeOptions: [
        {
          value: '1',
          label: '全部數據權限'
        },
        {
          value: '2',
          label: '自定數據權限'
        },
        {
          value: '3',
          label: '本部門數據權限'
        },
        {
          value: '4',
          label: '本部門及以下數據權限'
        },
        {
          value: '5',
          label: '僅本人數據權限'
        }
      ],
      // 選單列表
      menuOptions: [],
      // 部門列表
      deptOptions: [],
      // 查詢參數
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        roleName: undefined,
        roleKey: undefined,
        status: undefined
      },
      // 表單參數
      form: {},
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      // 表單校驗
      rules: {
        roleName: [
          { required: true, message: '角色名稱不能為空', trigger: 'blur' }
        ],
        roleKey: [
          { required: true, message: '權限字符不能為空', trigger: 'blur' }
        ],
        roleSort: [
          { required: true, message: '角色順序不能為空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查詢角色列表 */
    getList() {
      this.loading = true
      listRole(this.addDateRange(this.queryParams, this.dateRange)).then(
        response => {
          this.roleList = response.data.list
          this.total = response.data.count
          this.loading = false
        }
      )
    },
    /** 查詢選單樹結構 */
    getMenuTreeselect() {
      menuTreeselect().then(response => {
        this.menuOptions = response.data
      })
    },
    /** 查詢部門樹結構 */
    getDeptTreeselect() {
      deptTreeselect().then(response => {
        this.deptOptions = response.data.list
      })
    },
    // 所有選單節點數據
    getMenuAllCheckedKeys() {
      // 目前被選中的選單節點
      const checkedKeys = this.$refs.menu.getHalfCheckedKeys()
      // 半選中的選單節點
      const halfCheckedKeys = this.$refs.menu.getCheckedKeys()
      checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
      return checkedKeys
    },
    // 所有部門節點數據
    getDeptAllCheckedKeys() {
      // 目前被選中的部門節點
      const checkedKeys = this.$refs.dept.getCheckedKeys()
      // 半選中的部門節點
      // const halfCheckedKeys = this.$refs.dept.getCheckedKeys()
      // checkedKeys.unshift.apply(checkedKeys, halfCheckedKeys)
      return checkedKeys
    },
    /** 根據角色ID查詢選單樹結構 */
    getRoleMenuTreeselect(roleId) {
      roleMenuTreeselect(roleId).then(response => {
        this.menuOptions = response.menus
        this.$nextTick(() => {
          this.$refs.menu.setCheckedKeys(response.checkedKeys)
        })
      })
    },
    /** 根據角色ID查詢部門樹結構 */
    getRoleDeptTreeselect(roleId) {
      roleDeptTreeselect(roleId).then(response => {
        this.deptOptions = response.depts
        this.$nextTick(() => {
          this.$refs.dept.setCheckedKeys(response.checkedKeys)
        })
      })
    },
    // 角色狀態修改
    handleStatusChange(row) {
      const text = row.status === '0' ? '啟用' : '停用'
      this.$confirm('確認要"' + text + '""' + row.roleName + '"角色嗎?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return changeRoleStatus(row.roleId, row.status)
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
    // 取消按鈕（數據權限）
    cancelDataScope() {
      this.openDataScope = false
      this.reset()
    },
    // 表單重置
    reset() {
      if (this.$refs.menu !== undefined) {
        this.$refs.menu.setCheckedKeys([])
      }
      this.form = {
        roleId: undefined,
        roleName: undefined,
        roleKey: undefined,
        roleSort: 0,
        status: '0',
        menuIds: [],
        deptIds: [],
        remark: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按鈕操作 */
    handleQuery() {
      this.queryParams.pageIndex = 1
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
      this.ids = selection.map(item => item.roleId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按鈕操作 */
    handleAdd() {
      this.reset()
      this.getMenuTreeselect()
      this.open = true
      this.title = '添加角色'
      this.isEdit = false
    },
    /** 修改按鈕操作 */
    handleUpdate(row) {
      this.reset()
      const roleId = row.roleId || this.ids
      getRole(roleId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改角色'
        this.isEdit = true
        this.getRoleMenuTreeselect(roleId)
      })
    },
    /** 提交按鈕 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.roleId !== undefined) {
            this.form.menuIds = this.getMenuAllCheckedKeys()
            updateRole(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            this.form.menuIds = this.getMenuAllCheckedKeys()
            addRole(this.form).then(response => {
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
    /** 提交按鈕（數據權限） */
    submitDataScope: function() {
      if (this.form.roleId !== undefined) {
        this.form.deptIds = this.getDeptAllCheckedKeys()
        dataScope(this.form).then(response => {
          if (response.code === 200) {
            this.msgSuccess('修改成功')
            this.openDataScope = false
            this.getList()
          } else {
            this.msgError(response.msg)
          }
        })
      }
    },
    /** 刪除按鈕操作 */
    handleDelete(row) {
      const roleIds = row.roleId || this.ids
      this.$confirm('是否確認刪除角色編號為"' + roleIds + '"的數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delRole(roleIds)
      }).then(() => {
        this.getList()
        this.msgSuccess('刪除成功')
      }).catch(function() {})
    },
    /** 導出按鈕操作 */
    handleExport() {
      this.$confirm('是否確認導出所有角色數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.downloadLoading = true
        import('@/vendor/Export2Excel').then(excel => {
          const tHeader = ['角色編號', '角色名稱', '權限字符', '顯示順序', '狀態', '創建時間']
          const filterVal = ['roleId', 'roleName', 'roleKey', 'roleSort', 'status', 'create_time']
          const list = this.roleList
          const data = formatJson(filterVal, list)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '角色管理',
            autoWidth: true, // Optional
            bookType: 'xlsx' // Optional
          })
          this.downloadLoading = false
        })
      })
    }
  }
}
</script>
