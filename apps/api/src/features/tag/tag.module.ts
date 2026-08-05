import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { Tag } from './entities/tag.entity';
import { Note } from '../note/entities/note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Note])],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
