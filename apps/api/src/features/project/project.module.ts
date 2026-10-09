import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectAccessService } from './project-access.service';
import { Project } from './entities/project.entity';
import { Note } from '../note/entities/note.entity';
import { ProjectFolderModule } from '../project-folder/project-folder.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Note]), ProjectFolderModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectAccessService],
  exports: [ProjectService, ProjectAccessService],
})
export class ProjectModule {}
