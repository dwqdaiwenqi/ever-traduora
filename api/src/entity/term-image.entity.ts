import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccessTimestamps } from './base';
import { Project } from './project.entity';
import { DbType, getDbType } from '../utils/database-type-helper';

/**
 * 词条备注里粘贴的图片（比如这个词条出现在游戏哪个界面的截图）。
 * 备注文本里只存 `[[img:<id>]]` 这样的短标记，图片本身存在这里。
 */
@Entity()
export class TermImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: false })
  project: Project;

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: getDbType() === DbType.MYSQL ? 'longblob' : 'bytea' })
  data: Buffer;

  @Column(type => AccessTimestamps)
  date: AccessTimestamps;
}
