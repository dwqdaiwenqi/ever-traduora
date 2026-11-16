import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Translation } from '../entity/translation.entity';
import { TranslationVersion } from '../entity/translation-version.entity';

/** 每个语言最多保留的历史版本数，更早的在写入新版本时顺带清理 */
export const KEEP_VERSIONS = 50;

@Injectable()
export class TranslationVersionService {
  /** 某个语言当前已生效的完整内容：{ [term]: confirmedValue }，只含已确认且非空的词条 */
  async buildEffectiveContent(manager: EntityManager, projectLocaleId: string): Promise<{ [term: string]: string }> {
    const rows = await manager.find(Translation, { where: { projectLocaleId }, relations: ['term'] });
    const content: { [term: string]: string } = {};
    for (const row of rows.sort((a, b) => (a.term?.value ?? '').localeCompare(b.term?.value ?? ''))) {
      if (row.term && row.confirmedValue) {
        content[row.term.value] = row.confirmedValue;
      }
    }
    return content;
  }

  /**
   * 确认之后留存一份完整副本。必须在确认所在的事务里调用，保证"已生效"和"有副本"同时成功。
   * 一次批量确认只写一份。没有改动的词条时什么也不做，返回 null。
   */
  async saveSnapshot(manager: EntityManager, projectLocaleId: string, confirmedById: string | null, changedKeys: string[]): Promise<number | null> {
    if (changedKeys.length === 0) {
      return null;
    }
    const content = await this.buildEffectiveContent(manager, projectLocaleId);
    const last = await manager.findOne(TranslationVersion, {
      where: { projectLocale: { id: projectLocaleId } },
      order: { version: 'DESC' },
    });
    const version = (last?.version ?? 0) + 1;
    await manager.save(
      manager.create(TranslationVersion, {
        projectLocale: { id: projectLocaleId },
        version,
        content: JSON.stringify(content),
        changedKeys: JSON.stringify(changedKeys),
        confirmedById,
      }),
    );
    // MySQL 不支持只有 OFFSET 没有 LIMIT，所以先取出全部 id 再截断
    const all = await manager.find(TranslationVersion, {
      where: { projectLocale: { id: projectLocaleId } },
      select: { id: true },
      order: { version: 'DESC' },
    });
    const stale = all.slice(KEEP_VERSIONS);
    if (stale.length > 0) {
      await manager.delete(
        TranslationVersion,
        stale.map(v => v.id),
      );
    }
    return version;
  }
}
