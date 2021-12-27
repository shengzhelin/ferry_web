<template>
  <div>
    <img :src="options.img" title="點擊上傳頭像" class="img-circle img-lg" @click="editCropper()">
    <el-dialog :title="title" :visible.sync="open" width="800px">
      <el-row>
        <el-col :xs="24" :md="12" :style="{height: '350px'}">
          <vue-cropper
            ref="cropper"
            :img="options.img"
            :info="true"
            :auto-crop="options.autoCrop"
            :auto-crop-width="options.autoCropWidth"
            :auto-crop-height="options.autoCropHeight"
            :fixed-box="options.fixedBox"
            @realTime="realTime"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{height: '350px'}">
          <div class="avatar-upload-preview">
            <img :src="previews.url" :style="previews.img">
          </div>
        </el-col>
      </el-row>
      <br>
      <el-row>
        <el-col :lg="2" :md="2">
          <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
            <el-button size="small">
              上傳
              <i class="el-icon-upload el-icon--right" />
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{span: 1, offset: 2}" :md="2">
          <el-button icon="el-icon-plus" size="small" @click="changeScale(1)" />
        </el-col>
        <el-col :lg="{span: 1, offset: 1}" :md="2">
          <el-button icon="el-icon-minus" size="small" @click="changeScale(-1)" />
        </el-col>
        <el-col :lg="{span: 1, offset: 1}" :md="2">
          <el-button icon="el-icon-refresh-left" size="small" @click="rotateLeft()" />
        </el-col>
        <el-col :lg="{span: 1, offset: 1}" :md="2">
          <el-button icon="el-icon-refresh-right" size="small" @click="rotateRight()" />
        </el-col>
        <el-col :lg="{span: 2, offset: 6}" :md="2">
          <el-button type="primary" size="small" @click="uploadImg()">提 交</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script>
import store from '@/store'
import { VueCropper } from 'vue-cropper'
import { uploadAvatar } from '@/api/system/sysuser'

export default {
  components: { VueCropper },
  props: {
    // eslint-disable-next-line vue/require-default-prop
    user: { type: Object }
  },
  data() {
    return {
      // 是否顯示彈出層
      open: false,
      // 彈出層標題
      title: '修改頭像',
      options: {
        img: store.getters.avatar, // 裁剪圖片的地址
        autoCrop: true, // 是否默認生成截圖框
        autoCropWidth: 200, // 默認生成截圖框寬度
        autoCropHeight: 200, // 默認生成截圖框高度
        fixedBox: true // 固定截圖框大小 不允許改變
      },
      previews: {}
    }
  },
  methods: {
    // 編輯頭像
    editCropper() {
      this.open = true
    },
    // 覆蓋默認的上傳行為
    requestUpload() {
    },
    // 向左旋轉
    rotateLeft() {
      this.$refs.cropper.rotateLeft()
    },
    // 向右旋轉
    rotateRight() {
      this.$refs.cropper.rotateRight()
    },
    // 圖片縮放
    changeScale(num) {
      num = num || 1
      this.$refs.cropper.changeScale(num)
    },
    // 上傳預處理
    beforeUpload(file) {
      if (file.type.indexOf('image/') === -1) {
        this.msgError('文件格式錯誤，請上傳圖片類型,如：JPG，PNG後綴的文件。')
      } else {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          this.options.img = reader.result
        }
      }
    },
    // 上傳圖片
    uploadImg() {
      this.$refs.cropper.getCropBlob(data => {
        const formData = new FormData()
        formData.append('upload[]', data)
        uploadAvatar(formData).then(response => {
          if (response.code === 200) {
            this.open = false
            this.options.img = process.env.VUE_APP_BASE_API + '/' + response.data
            this.msgSuccess('修改成功')
          } else {
            this.msgError(response.msg)
          }
          this.$refs.cropper.clearCrop()
        })
      })
    },
    // 實時預覽
    realTime(data) {
      this.previews = data
    }
  }
}
</script>
