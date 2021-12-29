<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form :inline="true">
        <el-form-item label="部門名稱">
          <el-input
            v-model="queryParams.deptName"
            placeholder="請輸入部門名稱"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            class="filter-item"
            type="primary"
            icon="el-icon-search"
            size="small"
            @click="handleQuery"
          >搜索</el-button>
          <el-button
            v-permisaction="['system:sysdept:add']"
            class="filter-item"
            type="primary"
            icon="el-icon-plus"
            size="small"
            @click="handleAdd"
          >新增</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="deptList"
        row-key="deptId"
        border
        default-expand-all
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
      >
        <el-table-column prop="deptName" label="部門名稱" />
        <el-table-column prop="sort" label="排序" width="200" />
        <el-table-column prop="status" label="狀態" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === '1' ? 'danger' : 'success'"
              disable-transitions
            >{{ scope.row.status === '1' ? '停用' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="創建時間" align="center" prop="create_time" width="200">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.create_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['system:sysdept:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
            >編輯</el-button>
            <el-button
              v-permisaction="['system:sysdept:add']"
              size="mini"
              type="text"
              icon="el-icon-plus"
              @click="handleAdd(scope.row)"
            >新增</el-button>
            <el-button
              v-if="scope.row.p_id != 0"
              v-permisaction="['system:sysdept:remove']"
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >刪除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- 添加或修改部門對話框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="處級部門" prop="parentId">
              <treeselect
                v-model="form.parentId"
                :options="deptOptions"
                :normalizer="normalizer"
                :show-count="true"
                placeholder="選擇處級部門"
                :is-disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部門名稱" prop="deptName">
              <el-input v-model="form.deptName" placeholder="請輸入部門名稱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="顯示排序" prop="orderNum">
              <el-input-number v-model="form.sort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="負責人" prop="leader">
              <el-select v-model="form.leader" clearable filterable placeholder="請選擇負責人">
                <el-option
                  v-for="item in users"
                  :key="item.userId"
                  :label="item.nickName"
                  :value="item.userId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="聯繫電話" prop="phone">
              <el-input v-model="form.phone" placeholder="請輸入聯繫電話" maxlength="10" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信箱" prop="email">
              <el-input v-model="form.email" placeholder="請輸入信箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部門狀態">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in statusOptions"
                  :key="dict.value"
                  :label="dict.value"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">確 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listUser } from '@/api/system/sysuser'
import { getDeptList, getDept, delDept, addDept, updateDept } from '@/api/system/dept'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

export default {
  name: 'Dept',
  components: { Treeselect },
  data() {
    return {
      // 遮罩層
      loading: true,
      // 表格樹數據
      deptList: [],
      // 部門樹選項
      deptOptions: [],
      // 彈出層標題
      title: '',
      isEdit: false,
      // 是否顯示彈出層
      open: false,
      // 查詢參數
      queryParams: {
        deptName: undefined,
        status: undefined
      },
      users: [],
      // 表單參數
      form: {},
      // 表單校驗
      rules: {
        parentId: [
          { required: true, message: '處級部門不能為空', trigger: 'blur' }
        ],
        deptName: [
          { required: true, message: '部門名稱不能為空', trigger: 'blur' }
        ],
        leader: [
          { required: true, message: '部門負責人不能為空', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '選單順序不能為空', trigger: 'blur' }
        ],
        email: [
          {
            type: 'email',
            message: "'請輸入正確的信箱地址",
            trigger: ['blur', 'change']
          }
        ],
        phone: [
          {
            pattern: /^0[9][0-9]\d{7}$/,
            message: '請輸入正確的手機號碼',
            trigger: 'blur'
          }
        ]
      },
      statusOptions: [
        { label: '正常', value: '0' },
        { label: '停用', value: '1' }
      ]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查詢部門列表 */
    getList() {
      this.loading = true
      getDeptList(this.queryParams).then(response => {
        this.deptList = response.data
        this.loading = false
      })
    },
    // 查詢用戶
    getUsers() {
      listUser({
        pageSize: 999999
      }).then(response => {
        this.users = response.data.list
      })
    },
    /** 轉換部門數據結構 */
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
    /** 查詢部門下拉樹結構 */
    getTreeselect(e) {
      getDeptList().then(response => {
        this.deptOptions = []

        if (e === 'update') {
          const dept = { deptId: 0, deptName: '主類目', children: [], isDisabled: true }
          dept.children = response.data
          this.deptOptions.push(dept)
        } else {
          const dept = { deptId: 0, deptName: '主類目', children: [] }
          dept.children = response.data
          this.deptOptions.push(dept)
        }
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
        deptId: undefined,
        parentId: undefined,
        deptName: undefined,
        sorc: undefined,
        leader: undefined,
        phone: undefined,
        email: undefined,
        status: '0'
      }
    },
    /** 搜索按鈕操作 */
    handleQuery() {
      this.getList()
    },
    /** 新增按鈕操作 */
    handleAdd(row) {
      this.getUsers()
      this.reset()
      this.getTreeselect('add')
      if (row !== undefined) {
        this.form.parentId = row.deptId
      }
      this.open = true
      this.title = '添加部門'
      this.isEdit = false
    },
    /** 修改按鈕操作 */
    handleUpdate(row) {
      this.getUsers()
      this.reset()
      this.getTreeselect('update')

      getDept(row.deptId).then(response => {
        this.form = response.data
        if (this.form.leader === 0) {
          this.form.leader = ''
        }
        this.open = true
        this.title = '修改部門'
        this.isEdit = true
      })
    },
    /** 提交按鈕 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.deptId !== undefined) {
            updateDept(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addDept(this.form).then(response => {
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
      this.$confirm(
        '是否確認刪除名稱為"' + row.deptName + '"的數據項?',
        '警告',
        {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(function() {
          return delDept(row.deptId)
        })
        .then(() => {
          this.getList()
          this.msgSuccess('刪除成功')
        })
        .catch(function() {})
    }
  }
}
</script>
