import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccessTimestamps } from './base';
import { Project } from './project.entity';
import { Translation } from './translation.entity';

@Entity()
@Index(['project', 'value'], { unique: true })
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  @Column({
    nullable: true,
  })
  context: string | null;

  /** 导入文件里的出现顺序，导出时按它排，保证和原始文件的 key 顺序一致；空表示没有顺序（排在最后） */
  @Column({ type: 'int', nullable: true })
  position: number | null;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  project: Project;

  @OneToMany(() => Translation, translation => translation.term)
  @JoinColumn()
  translations: Translation[];

  @Column(type => AccessTimestamps)
  date: AccessTimestamps;
}
