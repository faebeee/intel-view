import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { Tag } from '../tag/entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Tag])],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
