import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectFolderController } from './project-folder.controller';
import { ProjectFolderService } from './project-folder.service';
import { ProjectFolder } from './entities/project-folder.entity';
import { Project } from '../project/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectFolder, Project])],
  controllers: [ProjectFolderController],
  providers: [ProjectFolderService],
  exports: [ProjectFolderService],
})
export class ProjectFolderModule {}
