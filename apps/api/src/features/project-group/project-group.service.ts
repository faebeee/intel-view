import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { ProjectGroup } from './entities/project-group.entity';
import { CreateProjectGroupDto } from './dto/create-project-group.dto';
import { UpdateProjectGroupDto } from './dto/update-project-group.dto';
import { Project } from '../project/entities/project.entity';

export const projectGroupPaginateConfig: PaginateConfig<ProjectGroup> = {
  sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: true,
  },
};

@Injectable()
export class ProjectGroupService {
  constructor(
    @InjectRepository(ProjectGroup)
    private readonly projectGroupRepository: Repository<ProjectGroup>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createProjectGroupDto: CreateProjectGroupDto,
  ): Promise<ProjectGroup> {
    const group = this.projectGroupRepository.create(createProjectGroupDto);
    return this.projectGroupRepository.save(group);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<ProjectGroup>> {
    return paginate(query, this.projectGroupRepository, {
      ...projectGroupPaginateConfig,
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<ProjectGroup | null> {
    return this.projectGroupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * Confirms a project group exists and is active. Used by ProjectService to
   * validate a `groupId` before assigning it to a project.
   */
  async assertExists(id: number): Promise<void> {
    const group = await this.findOne(id);
    if (!group) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
  }

  async update(
    id: number,
    updateProjectGroupDto: UpdateProjectGroupDto,
  ): Promise<ProjectGroup | null> {
    const group = await this.findOne(id);

    if (!group) {
      return null;
    }

    Object.assign(group, updateProjectGroupDto);

    group.updatedAt = new Date();
    return this.projectGroupRepository.save(group);
  }

  /**
   * Soft deletes the group and unassigns (sets groupId to null on) any
   * active projects that belonged to it, in a single transaction.
   */
  async remove(id: number): Promise<boolean> {
    const group = await this.findOne(id);
    if (!group) {
      return false;
    }

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.update(ProjectGroup, { id }, { deletedAt: now });
      await manager.update(
        Project,
        { groupId: id, deletedAt: IsNull() },
        { groupId: null },
      );
    });

    return true;
  }
}
