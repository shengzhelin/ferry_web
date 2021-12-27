<template>
  <div>
    <div class="panelRow">
      <div><span style="color: red">*</span> {{ i18n['label'] }}：</div>
      <el-input
        style="width:90%; font-size:12px"
        :disabled="readOnly"
        :value="model.label"
        size="small"
        @input="(value) => {onChange('label', value)}"
      />
    </div>
    <div class="panelRow">
      <div><span style="color: red">*</span> 順序：</div>
      <el-input
        size="small"
        style="width:90%; font-size:12px"
        :disabled="readOnly"
        :value="model.sort"
        @input="(value) => {onChange('sort', value)}"
      />
    </div>
    <div class="panelRow">
      <el-checkbox
        size="small"
        :disabled="readOnly"
        :value="!!model.isHideNode"
        @change="(value) => onChange('isHideNode', value)"
      >隱藏節點</el-checkbox>
      <el-checkbox
        size="small"
        :disabled="readOnly"
        :value="!!model.hideIcon"
        @change="(value) => onChange('hideIcon', value)"
      >{{ i18n['hideIcon'] }}</el-checkbox>
    </div>
  </div>
</template>
<script>
export default {
  inject: ['i18n'],
  props: {
    model: {
      type: Object,
      default: () => ({})
    },
    onChange: {
      type: Function,
      default: () => {}
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  }
}
</script>
