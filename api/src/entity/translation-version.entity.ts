import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccessTimestamps } from './base';
import { ProjectLocale } from './project-locale.entity';
import { DbType, getDbType } from '../utils/database-type-helper';

/**
 * 每次开发确认后留存的一份完整 JSON 副本（某个项目的某个语言），用来查历史、出问题时对照旧值。
 */
@Entity()
@Index(['projectLocale', 'version'], { unique: true })
export class TranslationVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProjectLocale, { onDelete: 'CASCADE', nullable: false })
  projectLocale: ProjectLocale;

  /** 在同一个 projectLocale 内从 1 开始递增 */
  @Column({ type: 'int' })
  version: number;

  /** 确认之后的完整已生效内容：{ [term]: value } 的 JSON 字符串 */
  @Column({ type: getDbType() === DbType.MYSQL ? 'longtext' : 'text' })
  content: string;

  /** 这次确认改动的词条（term.value）的 JSON 数组 */
  @Column({ type: 'text' })
  changedKeys: string;

  /** 确认人；通过 API 客户端确认时为 null */
  @Column({ type: 'varchar', length: 255, nullable: true })
  confirmedById: string | null;

  @Column(type => AccessTimestamps)
  date: AccessTimestamps;
}
