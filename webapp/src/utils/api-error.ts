import { get } from 'lodash';

const PROVIDER_SIGN_IN_MESSAGES: { [code: string]: string } = {
  account_exists: '该邮箱已注册账号。请先用常规方式登录，然后在账号设置（已关联的登录方式）中关联 Ever ID。',
  signup_disabled: '仅支持受邀注册。请先联系项目管理员邀请你。',
  email_unverified: '请先在 Ever ID 验证邮箱，然后重试。',
  sign_in_failed: '无法完成 Ever ID 登录，请重试。',
  issuer_rejected: '无法完成 Ever ID 登录，请重试。',
  session_ended: '此 Ever ID 会话已结束，请重新登录。',
  pending_invalid: '此步骤已过期，请重新开始。',
  pending_mismatch: '此关联由其他账号发起，请重新开始。',
  provider_disabled: 'Ever ID 登录不可用。',
  reauth_required: '请重新登录 Ever ID 以完成关联。',
  subject_linked: '此 Ever ID 已关联到另一个 Traduora 账号。',
  already_linked: '你的账号已关联 Ever ID。',
  last_sign_in_method: '这是你账号唯一的登录方式。请先设置密码（例如通过"忘记密码"），再取消关联。',
};

export function errorToMessage(error: any, action = ''): string {
  const domainCode = get(error, 'response.data.error.code') || get(error, 'error.error.code');

  if (domainCode && Object.prototype.hasOwnProperty.call(PROVIDER_SIGN_IN_MESSAGES, domainCode)) {
    return PROVIDER_SIGN_IN_MESSAGES[domainCode];
  }

  const status = error?.response?.status || error?.status;

  if (status === 429) {
    return action === 'Login' ? '登录尝试次数过多，该账号已被锁定 15 分钟。' : '请求过于频繁，请稍后再试。';
  } else if (status === 413) {
    return action === 'ImportLocale' ? '要导入的文件过大，请尝试拆分为多个较小的文件后再导入。' : '请求内容过大';
  } else if (domainCode === 'PublishedPassword') {
    return '该密码已被公开（例如曾经的默认密码），请换一个密码。';
  } else if (domainCode === 'BadRequest') {
    return action === 'ImportLocale' ? '要导入的文件格式错误或不正确，请检查文件是否有效后重试。' : '请求有误，请检查填写的内容后重试。';
  } else if (domainCode === 'AlreadyExists') {
    if (action === 'Signup') return '该邮箱已被注册，请使用其他邮箱。';
    if (action === 'InviteProjectUser') return '该用户已是项目团队成员';
    return '该值已存在，请使用其他值。';
  } else if (status === 404) {
    if (action === 'ResetPassword' || action === 'Login') return '找不到使用该邮箱的用户，请检查邮箱是否输入正确。';
    if (action === 'InviteProjectUser') return '找不到使用该邮箱的用户，该用户是否已在 Traduora 注册？';
    return '未找到所请求的资源';
  } else if (status === 422) {
    if (action === 'DeleteAccount') return '无法删除你的账号，因为你是一个或多个项目的唯一管理员。请先为这些项目指定其他管理员，或先删除这些项目，然后重试。';
    if (action === 'Login') return '该账号没有可用于登录的密码：它通过第三方登录创建，或其密码已被公开并已移除。请使用"忘记密码"设置新密码。';
    return '服务器无法处理该请求，请检查你的请求。';
  } else if (status === 402) {
    return '这将超出当前项目套餐的限额。请查看当前用量或升级套餐。';
  } else if (status === 401) {
    if (action === 'ResetPassword') return '密码重置令牌无效，请重新申请密码重置。';
    if (action === 'Login') return '账号或密码错误。';
    if (action === 'ChangePassword') return '无法修改密码，当前密码似乎输入有误。';
    if (action === 'Signup') return '该邮箱有待处理的邀请。请通过邀请邮件中的链接注册，或请项目管理员重新发送邀请。';
    return '未授权。';
  }

  if (action === 'ExportLocale') return '下载导出文件时出错，请重试。';
  if (action === 'ImportLocale') return '导入语言时出错';
  return '加载出错，请刷新页面。';
}
