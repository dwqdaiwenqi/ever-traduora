import { get } from 'lodash';

const LOGIN_MESSAGES: { [code: string]: string } = {
  EmailNotRegistered: '这个邮箱还没有被添加，请联系管理员把你加到活动里。',
  PasswordRequired: '该账号需要使用密码登录。',
};

export function errorToMessage(error: any, action = ''): string {
  const domainCode = get(error, 'response.data.error.code') || get(error, 'error.error.code');

  if (domainCode && Object.prototype.hasOwnProperty.call(LOGIN_MESSAGES, domainCode)) {
    return LOGIN_MESSAGES[domainCode];
  }

  const status = error?.response?.status || error?.status;

  if (status === 429) {
    return action === 'Login' ? '登录尝试次数过多，该账号已被锁定 15 分钟。' : '请求过于频繁，请稍后再试。';
  } else if (status === 413) {
    return action === 'ImportLocale' ? '要导入的文件过大，请尝试拆分为多个较小的文件后再导入。' : '请求内容过大';
  } else if (domainCode === 'BadRequest') {
    return action === 'ImportLocale' ? '要导入的文件格式错误或不正确，请检查文件是否有效后重试。' : '请求有误，请检查填写的内容后重试。';
  } else if (domainCode === 'AlreadyExists') {
    return '该值已存在，请使用其他值。';
  } else if (status === 404) {
    return '未找到所请求的资源';
  } else if (status === 422) {
    if (action === 'Login') return '这个账号没有密码，请直接用邮箱登录。';
    return '服务器无法处理该请求，请检查你的请求。';
  } else if (status === 402) {
    return '这将超出当前活动套餐的限额。请查看当前用量或升级套餐。';
  } else if (status === 401) {
    if (action === 'Login') return '邮箱或密码错误。';
    return '未授权。';
  }

  if (action === 'ExportLocale') return '下载导出文件时出错，请重试。';
  if (action === 'ImportLocale') return '导入语言时出错';
  return '加载出错，请刷新页面。';
}
