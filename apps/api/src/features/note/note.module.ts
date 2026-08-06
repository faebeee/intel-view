import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { Project } from '../project/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, NoteHistoryEntry, Project])],
  controllers: [NoteController],
  providers: [NoteService],
})
export class NoteModule {}
