const fs = require('fs')
const path = require('path')
const deepl = require('deepl-node') // 需安装：npm install deepl-node

// 1. 配置DeepL API密钥（免费注册获取：https://www.deepl.com/zh/pro-api）
const translator = new deepl.Translator('你的DeepL API密钥')

// 2. 语言映射（DeepL语言代码 ↔ 你的JSON文件名）
const langMap = {
  ja: 'JA', // 日语
  ko: 'KO', // 韩语
  ar: 'AR', // 阿拉伯语
  hi: 'HI', // 印地语
  de: 'DE', // 德语
  es: 'ES', // 西班牙语
  pt: 'PT-BR', // 葡萄牙语（巴西）
  ru: 'RU', // 俄语
  id: 'ID', // 印尼语
}

// 3. 读取英语基准文件
const enFilePath = path.resolve(__dirname, 'src/i18n/lang/en.json')
const enData = JSON.parse(fs.readFileSync(enFilePath, 'utf8'))

// 4. 递归翻译JSON对象
async function translateObj(obj, targetLang) {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      // 递归翻译子对象（如nav、search）
      result[key] = await translateObj(value, targetLang)
    } else {
      // 调用DeepL翻译文本
      const translation = await translator.translateText(
        value,
        'EN', // 源语言：英语
        targetLang, // 目标语言
      )
      result[key] = translation.text
    }
  }
  return result
}

// 5. 批量生成翻译文件
async function batchTranslate() {
  for (const [jsonName, deeplLang] of Object.entries(langMap)) {
    try {
      console.log(`开始翻译 ${jsonName}.json...`)
      const translatedData = await translateObj(enData, deeplLang)
      // 写入目标JSON文件
      const targetPath = path.resolve(__dirname, `src/i18n/lang/${jsonName}.json`)
      fs.writeFileSync(targetPath, JSON.stringify(translatedData, null, 2), 'utf8')
      console.log(`${jsonName}.json 翻译完成！`)
    } catch (err) {
      console.error(`翻译 ${jsonName}.json 失败：`, err.message)
    }
  }
}

// 执行批量翻译
batchTranslate()
