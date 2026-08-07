import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Project } from './entities/project.entity';

/**
 * Shared "does this project exist and is it active?" check, used by any
 * service scoped under a project (notes, tags, ...) to validate the
 * `projectId` route param before operating on child resources, without each
 * service duplicating its own `Project` repository injection + lookup.
 */
@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async assertExists(projectId: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
  }
}
