// 业务前端如何读取翻译（只读"开发已确认"的内容，不需要登录）
//
// 用法:
//   TR_ACTIVITY_ID=活动ID node demo/index.js [语言代码] [兜底语言代码]
//
// 例子（读日文，缺失的 key 回退到国服 zh_CN）:
//   TR_ACTIVITY_ID=xxxx-xxxx node demo/index.js ja_JP zh_CN
//
// 可选环境变量:
//   TR_API   接口地址，默认 http://localhost:8080/api/v1
//
// 需要 Node 18+（自带 fetch）。
//
// 说明:
//   - 一个活动对应翻译中台里的一个项目，"活动ID"就是该项目的 ID。
//   - 接口只返回开发已经点过"确认"的翻译。运营刚提交、还没确认的内容不会出现，
//     所以测试环境和正式环境的页面读到的内容是一致的。
//   - 缺失的 key 不会返回，由前端回退到兜底语言（通常是国服），不要把 key 名直接显示给玩家。

const API = process.env.TR_API || 'http://localhost:8080/api/v1';
const ACTIVITY_ID = process.env.TR_ACTIVITY_ID;

if (!ACTIVITY_ID) {
  console.error('请设置环境变量 TR_ACTIVITY_ID（活动ID）');
  process.exit(1);
}

// 页面里通常把缓存放在内存或 localStorage；这里用一个对象代替，演示 ETag 的用法
const cache = {};

/**
 * 读取某个语言已生效的翻译，返回 { key: 文案 }。
 * 带上上次的 ETag，没变化时服务端返回 304，不用重复下载。
 */
async function loadMessages(locale) {
  const url = `${API}/i18n/${ACTIVITY_ID}/${locale}`;
  const cached = cache[locale];
  const res = await fetch(url, cached ? { headers: { 'If-None-Match': cached.etag } } : undefined);

  if (res.status === 304) {
    return { messages: cached.messages, fromCache: true };
  }
  if (!res.ok) {
    throw new Error(`读取 ${locale} 失败: ${res.status} ${await res.text()}`);
  }
  const messages = await res.json();
  cache[locale] = { etag: res.headers.get('etag'), messages };
  return { messages, fromCache: false };
}

/**
 * 创建翻译函数 t(key)：先查当前语言，缺失就查兜底语言，都没有就返回 key 本身（方便发现漏翻）。
 */
function createTranslator(messages, fallbackMessages = {}) {
  return key => messages[key] || fallbackMessages[key] || key;
}

async function main() {
  const locale = process.argv[2];
  const fallbackLocale = process.argv[3];
  if (!locale) {
    console.error('请指定语言代码，例如: node demo/index.js ja_JP zh_CN');
    process.exit(1);
  }

  // 第 1 步：读取当前语言
  const current = await loadMessages(locale);
  const keys = Object.keys(current.messages);
  console.log(`1. 读取 ${locale}：已生效 ${keys.length} 条`);

  // 第 2 步：读取兜底语言（可选）
  let fallback = {};
  if (fallbackLocale && fallbackLocale !== locale) {
    fallback = (await loadMessages(fallbackLocale)).messages;
    const missing = Object.keys(fallback).filter(k => !current.messages[k]);
    console.log(`2. 读取兜底 ${fallbackLocale}：共 ${Object.keys(fallback).length} 条，${locale} 缺失 ${missing.length} 条，将回退显示`);
    for (const k of missing.slice(0, 5)) console.log(`   缺失 ${k} -> 回退 "${fallback[k]}"`);
  } else {
    console.log('2. 未指定兜底语言，缺失的 key 会直接显示 key 名');
  }

  // 第 3 步：使用
  const t = createTranslator(current.messages, fallback);
  console.log('3. 使用示例:');
  for (const k of keys.slice(0, 5)) console.log(`   t('${k}') = ${t(k)}`);
  console.log(`   t('not.exist.key') = ${t('not.exist.key')}`);

  // 第 4 步：再请求一次，演示 ETag：内容没变时返回 304，直接用缓存
  const again = await loadMessages(locale);
  console.log(`4. 再次请求 ${locale}：${again.fromCache ? '304 未变化，使用缓存' : '内容有更新，已重新下载'}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
