import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { NoteRelation } from './entities/note-relation.entity';
import { NoteLogEntry } from './entities/note-log-entry.entity';
import { ProjectModule } from '../project/project.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Note,
      NoteHistoryEntry,
      NoteRelation,
      NoteLogEntry,
    ]),
    ProjectModule,
    StorageModule,
  ],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
