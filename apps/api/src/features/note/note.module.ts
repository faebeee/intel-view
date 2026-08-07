import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([Note, NoteHistoryEntry]), ProjectModule],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
