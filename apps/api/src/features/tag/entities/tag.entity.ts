import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
@Index('UQ_tag_name', ['name'], { unique: true })
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @ApiProperty({ description: 'Name of the tag' })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Color of the tag (HEX code or name)' })
  color: string;
}
