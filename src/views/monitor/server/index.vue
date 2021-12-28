<template>
  <div class="app-container">
    <el-row>

      <el-col :span="12" class="card-box">
        <el-card>
          <div slot="header">
            <span>服務器訊息</span>
          </div>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <table cellspacing="0" style="width: 100%;">
              <thead>
                <tr>
                  <th class="is-leaf"><div class="cell">屬性</div></th>
                  <th class="is-leaf"><div class="cell">值</div></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div class="cell">服務器架構</div></td>
                  <td><div v-if="server.os" class="cell">{{ server.os.arch }}</div></td>
                </tr>
                <tr>
                  <td><div class="cell">操作系統</div></td>
                  <td><div v-if="server.os" class="cell">{{ server.os.goOs }}</div></td>
                </tr>
                <tr>
                  <td><div class="cell">核心數</div></td>
                  <td><div v-if="server.cpu" class="cell">{{ server.cpu.cpuNum }}</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="card-box">
        <el-card>
          <div slot="header"><span>內存</span></div>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <table cellspacing="0" style="width: 100%;">
              <thead>
                <tr>
                  <th class="is-leaf"><div class="cell">屬性</div></th>
                  <th class="is-leaf"><div class="cell">值</div></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div class="cell">總內存</div></td>
                  <td><div v-if="server.mem" class="cell">{{ server.mem.total }}G</div></td>

                </tr>
                <tr>
                  <td><div class="cell">已用內存</div></td>
                  <td><div v-if="server.mem" class="cell">{{ server.mem.used }}G</div></td>

                </tr>
                <tr>
                  <td><div class="cell">使用率</div></td>
                  <td><div v-if="server.mem" class="cell" :class="{'text-danger': server.mem.usage > 80}">{{ server.mem.usage }}%</div></td>

                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="card-box">
        <el-card>
          <div slot="header">
            <span>go運行環境</span>
          </div>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <table cellspacing="0" style="width: 100%;">
              <thead>
                <tr>
                  <th class="is-leaf"><div class="cell">屬性</div></th>
                  <th class="is-leaf"><div class="cell">值</div></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div class="cell">go version</div></td>
                  <td><div v-if="server.os" class="cell">{{ server.os.version }}</div></td>
                </tr>
                <tr>
                  <td><div class="cell">Goroutine</div></td>
                  <td><div v-if="server.os" class="cell">{{ server.os.numGoroutine }}</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12" class="card-box">
        <el-card>
          <div slot="header">
            <span>硬碟狀態</span>
          </div>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <table cellspacing="0" style="width: 100%;">
              <thead>
                <tr>
                  <th class="is-leaf"><div class="cell">屬性</div></th>
                  <th class="is-leaf"><div class="cell">值</div></th>
                </tr>
              </thead>
              <tbody v-if="server.disk">

                <tr>
                  <td><div class="cell">總共</div></td>
                  <td><div class="cell">{{ server.disk.total }}</div></td>
                </tr>
                <tr>
                  <td><div class="cell">可用</div></td>
                  <td><div class="cell">{{ server.disk.free }}</div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getServer } from '@/api/monitor/server'

export default {
  name: 'Server',
  data() {
    return {
      // 加載層訊息
      loading: [],
      // 服務器訊息
      server: []
    }
  },
  created() {
    this.getList()
    this.openLoading()
  },
  methods: {
    /** 查詢服務器訊息 */
    getList() {
      getServer().then(response => {
        this.server = response
        this.loading.close()
      })
    },
    // 打開加載層
    openLoading() {
      this.loading = this.$loading({
        lock: true,
        text: '拼命讀取中',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }
  }
}
</script>
