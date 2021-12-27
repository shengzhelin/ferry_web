<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form ref="listQuery" :model="listQuery" :inline="true">
        <el-form-item label="分類名稱">
          <el-input
            v-model="listQuery.name"
            placeholder="請輸入分類名稱"
            clearable
            size="small"
            style="width: 240px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            v-permisaction="['process:admin:classify:add']"
            type="primary"
            icon="el-icon-plus"
            size="mini"
            @click="handleCreate"
          >新增</el-button>
        </el-col>
        <!-- <el-col :span="1.5">
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
        </el-col> -->
      </el-row>

      <el-table v-loading="loading" border :data="classifyList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="ID" prop="id" width="120" />
        <el-table-column label="名稱" prop="name" :show-overflow-tooltip="true" />
        <el-table-column label="創建者" prop="create_name" :show-overflow-tooltip="true" width="150" />
        <el-table-column label="創建時間" align="center" prop="create_time" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.create_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['process:admin:classify:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleEdit(scope.row)"
            >編輯</el-button>
            <el-button
              v-permisaction="['process:admin:classify:delete']"
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

      <el-dialog :title="dialogFormVisibleName===1?'新建分類':'編輯分類'" :visible.sync="open" width="600px">
        <div class="tpl-create-content">
          <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="100px">
            <el-form-item label="分類名稱" prop="name" style="width: 95%">
              <el-input v-model="ruleForm.name" />
            </el-form-item>
          </el-form>
          <div slot="footer" class="dialog-footer" style="text-align: right">
            <el-button type="primary" @click="dialogFormVisibleName===1?submitForm('ruleForm'):editForm('ruleForm')">提交</el-button>
            <el-button @click="open = false">取 消</el-button>
          </div>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import {
  createClassify,
  classifyList,
  updateClassify,
  deleteClassify
} from '@/api/process/admin/classify'

export default {
  name: 'Classify',
  data() {
    return {
      dialogFormVisibleName: 1,
      queryParams: {},
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
      // 是否顯示彈出層
      open: false,
      // 查詢參數
      classifyList: [],
      listQuery: {
        page: 1,
        per_page: 10
      },
      ruleForm: {
        id: undefined,
        name: ''
      },
      rules: {
        name: [
          { required: true, message: '請輸入流程分類', trigger: 'blur' }
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
      this.listQuery.page = this.queryParams.pageIndex
      this.listQuery.per_page = this.queryParams.pageSize
      classifyList(this.listQuery).then(response => {
        this.classifyList = response.data.data
        this.queryParams.pageIndex = response.data.page
        this.queryParams.pageSize = response.data.per_page
        this.total = response.data.total_count
        this.loading = false
      })
    },
    handleCreate() {
      this.ruleForm = {
        id: undefined,
        name: ''
      }
      this.dialogFormVisibleName = 1
      this.open = true
    },
    handleEdit(row) {
      this.dialogFormVisibleName = 2
      this.ruleForm.id = row.id
      this.ruleForm.name = row.name
      this.open = true
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          createClassify(this.ruleForm).then(response => {
            if (response !== undefined) {
              this.getList()
              this.$message({
                type: 'success',
                message: '分類已增加!'
              })
              this.open = false
            }
          })
        }
      })
    },
    editForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          updateClassify(this.ruleForm).then(response => {
            if (response !== undefined) {
              this.getList()
              this.$message({
                type: 'success',
                message: '分類已更新!'
              })
              this.open = false
            }
          })
        }
      })
    },
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.queryParams.pageSize = 10
      this.getList()
    },
    handleDelete(row) {
      this.$confirm('此操作將永久刪除該數據, 是否繼續?', '提示', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteClassify({
          classifyId: row.id
        }).then(response => {
          if (response !== undefined) {
            this.getList()
            this.$message({
              type: 'success',
              message: '分類已刪除!'
            })
          }
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消刪除'
        })
      })
    },
    handleSelectionChange() {}
  }
}
</script>
