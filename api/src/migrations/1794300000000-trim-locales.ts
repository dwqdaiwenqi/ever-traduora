import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '../config';
import { DbType } from '../utils/database-type-helper';

/** 业务只有五个服：国服、港澳台、美服、韩服、日服。语言表只保留这五条，其余没被活动用到的全部删除 */
const SERVERS: { code: string; language: string; region: string }[] = [
  { code: 'zh_CN', language: '国服', region: '中国大陆' },
  { code: 'zh_TW', language: '港澳台', region: '港澳台地区' },
  { code: 'en_US', language: '美服', region: '美国' },
  { code: 'ko_KR', language: '韩服', region: '韩国' },
  { code: 'ja_JP', language: '日服', region: '日本' },
];

export class trimLocales1794300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const type = config.db.default.type;
    if (type !== DbType.POSTGRES && type !== DbType.MYSQL) {
      throw new Error(`Unknown DB type: ${type}`);
    }
    const isPg = type === DbType.POSTGRES;
    const q = (name: string) => (isPg ? `"${name}"` : `\`${name}\``);
    const p = (i: number) => (isPg ? `$${i}` : '?');

    for (const s of SERVERS) {
      await queryRunner.query(`UPDATE ${q('locale')} SET ${q('language')} = ${p(1)}, ${q('region')} = ${p(2)} WHERE ${q('code')} = ${p(3)}`, [
        s.language,
        s.region,
        s.code,
      ]);
    }

    // project_locale 对 locale 是 ON DELETE CASCADE：只删没被任何活动用过的，避免连带删掉已有翻译
    const codes = SERVERS.map(s => s.code);
    const placeholders = codes.map((_, i) => p(i + 1)).join(', ');
    const usedColumn = isPg ? 'locale_code' : 'localeCode';
    await queryRunner.query(
      `DELETE FROM ${q('locale')} WHERE ${q('code')} NOT IN (${placeholders}) ` +
        `AND ${q('code')} NOT IN (SELECT ${q(usedColumn)} FROM ${q('project_locale')} WHERE ${q(usedColumn)} IS NOT NULL)`,
      codes,
    );
  }

  public async down(): Promise<void> {
    // 被删除的语言不再恢复
  }
}
