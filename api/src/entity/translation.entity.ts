import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AccessTimestamps } from './base';
import { ProjectLocale } from './project-locale.entity';
import { Term } from './term.entity';

@Entity()
export class Translation {
  @PrimaryColumn()
  termId: string;

  @PrimaryColumn()
  projectLocaleId: string;

  @Column({ type: 'text' })
  value: string;

  /**
   * 开发已确认、对外接口真正返回的值。null 表示还没有确认过。
   * value（运营填写的最新值）和它不一致时，这条翻译处于"待开发确认"状态。
   */
  @Column({ type: 'text', nullable: true })
  confirmedValue: string | null;

  @ManyToOne(type => Term, term => term.translations, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn()
  term: Term;

  @ManyToOne(type => ProjectLocale, { onDelete: 'CASCADE', nullable: false })
  projectLocale: ProjectLocale;

  @Column(type => AccessTimestamps)
  date: AccessTimestamps;
}
