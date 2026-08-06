import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @ApiProperty({ description: 'Name of the tag' })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Color of the tag (HEX code or name)' })
  color: string;
}
