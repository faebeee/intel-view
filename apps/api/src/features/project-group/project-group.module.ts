import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectGroupController } from './project-group.controller';
import { ProjectGroupService } from './project-group.service';
import { ProjectGroup } from './entities/project-group.entity';
import { Project } from '../project/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectGroup, Project])],
  controllers: [ProjectGroupController],
  providers: [ProjectGroupService],
  exports: [ProjectGroupService],
})
export class ProjectGroupModule {}
