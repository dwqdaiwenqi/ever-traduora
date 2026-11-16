/**
 * 词条备注 = 文字 + 若干张图片。图片存在服务端，备注字符串里只留 `[[img:<uuid>]]` 标记，
 * 这样备注仍然是一个普通字符串（后端限制 1000 字符），旧数据不用迁移。
 */
const IMG_TOKEN = /\[\[img:([0-9a-fA-F-]{36})\]\]/g;

export const CONTEXT_MAX_LENGTH = 1000;

export function parseContext(context: string | null | undefined): { text: string; imageIds: string[] } {
  const raw = context ?? '';
  const imageIds: string[] = [];
  const text = raw
    .replace(IMG_TOKEN, (_, id: string) => {
      imageIds.push(id);
      return '';
    })
    .trim();
  return { text, imageIds };
}

export function composeContext(text: string, imageIds: string[]): string {
  return [text.trim(), ...imageIds.map(id => `[[img:${id}]]`)].filter(Boolean).join('\n');
}
