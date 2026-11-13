// 用法:
//   TR_CLIENT_ID=xxx TR_CLIENT_SECRET=xxx node demo/index.js [语言代码]
// 需要 Node 18+（自带 fetch）。

const API = process.env.TR_API || 'http://localhost:8080/api/v1';
const CLIENT_ID = process.env.TR_CLIENT_ID;
const CLIENT_SECRET = process.env.TR_CLIENT_SECRET;
const PROJECT_ID = process.env.TR_PROJECT_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !PROJECT_ID) {
  console.error('请设置环境变量 TR_CLIENT_ID、TR_CLIENT_SECRET、TR_PROJECT_ID');
  process.exit(1);
}

async function main() {
  // 第 1 步：用 客户端ID + 密钥 换一个临时 token
  const tokenRes = await fetch(`${API}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`换取 token 失败: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const { access_token } = await tokenRes.json();
  console.log('1. 拿到 token:', access_token.slice(0, 20) + '...');

  // 第 2 步：带着 token 去请求真正的数据
  const headers = { Authorization: `Bearer ${access_token}` };

  const localesRes = await fetch(`${API}/projects/${PROJECT_ID}/translations`, { headers });
  if (!localesRes.ok) {
    throw new Error(`获取语言列表失败: ${localesRes.status} ${await localesRes.text()}`);
  }
  const codes = (await localesRes.json()).data.map(l => l.locale.code);
  console.log('2. 项目里的语言:', codes.join(', '));

  const locale = process.argv[2] || codes[0];
  const exportRes = await fetch(
    `${API}/projects/${PROJECT_ID}/exports?locale=${locale}&format=jsonflat`,
    { headers },
  );
  if (!exportRes.ok) {
    throw new Error(`导出失败: ${exportRes.status} ${await exportRes.text()}`);
  }
  const translations = await exportRes.json();
  console.log('translations',translations)
  const keys = Object.keys(translations);
  console.log(`3. 导出 ${locale} 翻译，共 ${keys.length} 条，前 5 条:`);
  for (const k of keys.slice(0, 5)) console.log(`   ${k} = ${translations[k]}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
