/**
 * 計算字符串的長度
 * @param {string} str 指定的字符串
 * @return {number} 字符串長度
 */
export const calcStrLen = str => {
  let len = 0
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 0 && str.charCodeAt(i) < 128) {
      len++
    } else {
      len += 2
    }
  }
  return len
}

/**
 * 計算顯示的字符串
 * @param {string} str 要裁剪的字符串
 * @param {number} maxWidth 最大寬度
 * @param {number} fontSize 字體大小
 * @return {string} 顯示的字符串
 */
export const fittingString = (str, maxWidth, fontSize) => {
  const fontWidth = fontSize * 1.3 // 字號+邊距
  maxWidth = maxWidth * 2 // 需要根據自己項目調整
  const width = calcStrLen(str) * fontWidth
  const ellipsis = '…'
  if (width > maxWidth) {
    const actualLen = Math.floor((maxWidth - 10) / fontWidth)
    const result = str.substring(0, actualLen) + ellipsis
    return result
  }
  return str
}
