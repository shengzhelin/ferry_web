<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
        <el-form-item label="登錄地址">
          <el-input
            v-model="queryParams.ipaddr"
            placeholder="請輸入登錄地址"
            clearable
            style="width: 240px;"
            size="small"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="用戶名稱">
          <el-input
            v-model="queryParams.username"
            placeholder="請輸入用戶名稱"
            clearable
            style="width: 240px;"
            size="small"
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
            v-permisaction="['system:sysloginlog:remove']"
            type="danger"
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
          >刪除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysloginlog:clean']"
            type="danger"
            icon="el-icon-delete"
            size="mini"
            @click="handleClean"
          >清空</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            v-permisaction="['system:sysloginlog:export']"
            type="warning"
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
          >導出</el-button>
        </el-col>
      </el-row>

      <el-table v-loading="loading" border :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="編號" width="100" align="center" prop="infoId" />
        <el-table-column label="用戶名稱" width="150" align="center" prop="username" />
        <el-table-column label="登錄地址" align="center" prop="ipaddr" width="130" :show-overflow-tooltip="true" />
        <el-table-column label="登錄地點" align="center" prop="loginLocation" />
        <el-table-column label="瀏覽器" align="center" prop="browser" />
        <el-table-column label="操作系統" align="center" prop="os" />
        <el-table-column label="操作信息" width="120" align="center" prop="msg" />
        <el-table-column label="登錄日期" align="center" prop="loginTime" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
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
  </div>
</template>

<script>
import { list, delLogininfor, cleanLogininfor } from '@/api/system/loginlog'
import { formatJson } from '@/utils'

export default {
  name: 'Logininfor',
  data() {
    return {
      // 遮罩層
      loading: true,
      // 選中數組
      ids: [],
      // 非多個禁用
      multiple: true,
      // 總條數
      total: 0,
      // 表格數據
      list: [],
      // 日期範圍
      dateRange: [],
      // 查詢參數
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        ipaddr: undefined,
        username: undefined,
        status: undefined
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查詢登錄日志列表 */
    getList() {
      this.loading = true
      list(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.list = response.data.list
        this.total = response.data.count
        this.loading = false
      }
      )
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
      this.ids = selection.map(item => item.infoId)
      this.multiple = !selection.length
    },
    /** 刪除按鈕操作 */
    handleDelete(row) {
      const infoIds = row.infoId || this.ids
      this.$confirm('是否確認刪除訪問編號為"' + infoIds + '"的數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delLogininfor(infoIds)
      }).then(() => {
        this.getList()
        this.msgSuccess('刪除成功')
      }).catch(function() {})
    },
    /** 清空按鈕操作 */
    handleClean() {
      this.$confirm('是否確認清空所有登錄日志數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return cleanLogininfor()
      }).then(response => {
        if (response.code === 200) {
          this.getList()
          this.msgSuccess('清空成功')
        }
      }).catch(function() {})
    },
    /** 導出按鈕操作 */
    handleExport() {
      // const queryParams = this.queryParams
      this.$confirm('是否確認導出所有操作日志數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.downloadLoading = true
        import('@/vendor/Export2Excel').then(excel => {
          const tHeader = ['編號', '用戶名稱', '登陸地址', '登陸地點', '瀏覽器', '操作系統', '登陸狀態', '操作信息', '登陸日期']
          const filterVal = ['infoId', 'username', 'ipaddr', 'loginLocation', 'browser', 'os', 'status', 'msg', 'loginTime']
          const list = this.list
          const data = formatJson(filterVal, list)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '登陸日志',
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

