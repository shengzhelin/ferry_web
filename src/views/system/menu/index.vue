<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-form :inline="true">
        <el-form-item label="菜單名稱">
          <el-input
            v-model="queryParams.title"
            placeholder="請輸入菜單名稱"
            clearable
            size="small"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button
            v-permisaction="['system:sysmenu:add']"
            type="primary"
            icon="el-icon-plus"
            size="small"
            @click="handleAdd"
          >新增</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        border
        :data="menuList"
        row-key="menuId"
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
      >
        <el-table-column prop="title" label="菜單名稱" :show-overflow-tooltip="true" width="180px" />
        <el-table-column prop="icon" label="圖標" align="center" width="100px">
          <template slot-scope="scope">
            <svg-icon :icon-class="scope.row.icon" />
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="60px" />
        <el-table-column prop="permission" label="權限標識" :show-overflow-tooltip="true" />
        <el-table-column prop="path" label="路徑" :show-overflow-tooltip="true">
          <template slot-scope="scope">
            <span v-if="scope.row.menuType=='A'">{{ scope.row.path }}</span>
            <span v-else>{{ scope.row.component }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="visible" label="可見" :formatter="visibleFormat" width="80">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.visible === '1' ? 'danger' : 'success'"
              disable-transitions
            >{{ visibleFormat(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="創建時間" align="center" prop="create_time" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.create_time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
          <template slot-scope="scope">
            <el-button
              v-permisaction="['system:sysmenu:edit']"
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
            >編輯</el-button>
            <el-button
              v-permisaction="['system:sysmenu:add']"
              size="mini"
              type="text"
              icon="el-icon-plus"
              @click="handleAdd(scope.row)"
            >新增</el-button>
            <el-button
              v-permisaction="['system:sysmenu:remove']"
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >刪除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- 添加或修改菜單對話框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="上級菜單" style="width: 95%">
              <treeselect
                v-model="form.parentId"
                :options="menuOptions"
                :normalizer="normalizer"
                :show-count="true"
                placeholder="選擇上級菜單"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜單標題" prop="title" style="width: 90%">
              <el-input v-model="form.title" placeholder="請輸入菜單標題" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="顯示排序" prop="sort">
              <el-input-number v-model="form.sort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="菜單類型" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio label="M">目錄</el-radio>
                <el-radio label="C">菜單</el-radio>
                <el-radio label="F">按鈕</el-radio>
                <el-radio label="A">接口</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item v-if="form.menuType == 'A'" label="請求方式">
              <el-radio-group v-model="form.action">
                <el-radio label="GET">GET</el-radio>
                <el-radio label="POST">POST</el-radio>
                <el-radio label="PUT">PUT</el-radio>
                <el-radio label="DELETE">DELETE</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜單圖標" style="width: 95%">
              <el-popover
                placement="bottom-start"
                width="460"
                trigger="click"
                @show="$refs['iconSelect'].reset()"
              >
                <IconSelect ref="iconSelect" @selected="selected" />
                <el-input slot="reference" v-model="form.icon" placeholder="點擊選擇圖標" readonly>
                  <svg-icon
                    v-if="form.icon"
                    slot="prefix"
                    :icon-class="form.icon"
                    class="el-input__icon"
                    style="height: 32px;width: 16px;"
                  />
                  <i v-else slot="prefix" class="el-icon-search el-input__icon" />
                </el-input>
              </el-popover>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.menuType == 'M' || form.menuType == 'C'" label="路由名稱" prop="menuName" style="width: 90%">
              <el-input v-model="form.menuName" placeholder="請輸入路由名稱" />
            </el-form-item>
          </el-col>

          <el-col v-if="form.menuType == 'M' || form.menuType == 'C'" :span="12">
            <el-form-item label="組件路徑" prop="component" style="width: 90%">
              <el-input v-model="form.component" placeholder="請輸入組件路徑" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item v-if="form.menuType == 'M' || form.menuType == 'C'" label="是否外鏈">
              <el-radio-group v-model="form.isFrame">
                <el-radio label="0">是</el-radio>
                <el-radio label="1">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item v-if="form.menuType != 'F'" label="路由地址" prop="path" style="width: 90%">
              <el-input v-model="form.path" placeholder="請輸入路由地址" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item v-if="form.menuType == 'F' || form.menuType == 'C'" label="權限標識" style="width: 90%">
              <el-input v-model="form.permission" placeholder="請權限標識" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item v-if="form.menuType != 'F'" label="菜單狀態">
              <el-radio-group v-model="form.visible">
                <el-radio
                  v-for="dict in visibleOptions"
                  :key="dict.dictValue"
                  :label="dict.dictValue"
                >{{ dict.dictLabel }}</el-radio>
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
import { listMenu, getMenu, delMenu, addMenu, updateMenu } from '@/api/system/menu'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import IconSelect from '@/components/IconSelect'

export default {
  name: 'Menu',
  components: { Treeselect, IconSelect },
  data() {
    return {
      // 遮罩層
      loading: true,
      // 菜單表格樹數據
      menuList: [],
      // 菜單樹選項
      menuOptions: [],
      // 彈出層標題
      title: '',
      // 是否顯示彈出層
      open: false,
      // 菜單狀態數據字典
      visibleOptions: [{
        dictValue: '0',
        dictLabel: '顯示'
      }, {
        dictValue: '1',
        dictLabel: '隱藏'
      }],
      // 查詢參數
      queryParams: {
        title: undefined,
        visible: undefined
      },
      // 表單參數
      form: {},
      // 表單校驗
      rules: {
        title: [
          { required: true, message: '菜單標題不能為空', trigger: 'blur' }
        ],
        sort: [
          { required: true, message: '菜單順序不能為空', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    // 選擇圖標
    selected(name) {
      this.form.icon = name
    },
    /** 查詢菜單列表 */
    getList() {
      this.loading = true
      listMenu(this.queryParams).then(response => {
        this.menuList = response.data
        this.loading = false
      })
    },
    /** 轉換菜單數據結構 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children
      }
      return {
        id: node.menuId,
        label: node.title,
        children: node.children
      }
    },
    /** 查詢菜單下拉樹結構 */
    getTreeselect() {
      listMenu().then(response => {
        this.menuOptions = []
        const menu = { menuId: 0, title: '主類目', children: [] }
        menu.children = response.data
        this.menuOptions.push(menu)
      })
    },
    // 菜單顯示狀態字典翻譯
    visibleFormat(row) {
      if (row.menuType === 'F') {
        return '-- --'
      } else if (row.visible === '1') {
        return '隱藏'
      } else if (row.visible === '0') {
        return '可見'
      }
    },
    // 取消按鈕
    cancel() {
      this.open = false
      this.reset()
    },
    // 表單重置
    reset() {
      this.form = {
        menuId: undefined,
        parentId: 0,
        menuName: undefined,
        icon: undefined,
        menuType: 'M',
        sort: 0,
        action: this.form.menuType === 'A' ? this.form.action : '',
        isFrame: '1',
        visible: '0'
      }
      this.resetForm('form')
    },
    /** 搜索按鈕操作 */
    handleQuery() {
      this.getList()
    },
    /** 新增按鈕操作 */
    handleAdd(row) {
      this.reset()
      this.getTreeselect()
      if (row != null) {
        this.form.parentId = row.menuId
      }
      this.open = true
      this.title = '添加菜單'
    },
    /** 修改按鈕操作 */
    handleUpdate(row) {
      this.reset()
      this.getTreeselect()
      getMenu(row.menuId).then(response => {
        this.form = response.data
        this.open = true
        this.title = '修改菜單'
      })
    },
    /** 提交按鈕 */
    submitForm: function() {
      this.$refs['form'].validate(valid => {
        if (valid) {
          if (this.form.menuId !== undefined) {
            updateMenu(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess('修改成功')
                this.open = false
                this.getList()
              } else {
                this.msgError(response.msg)
              }
            })
          } else {
            addMenu(this.form).then(response => {
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
      this.$confirm('是否確認刪除名稱為"' + row.title + '"的數據項?', '警告', {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return delMenu(row.menuId)
      }).then(() => {
        this.getList()
        this.msgSuccess('刪除成功')
      }).catch(function() {})
    }
  }
}
</script>
