import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Note } from '../note/entities/note.entity';
import { Tag } from '../tag/entities/tag.entity';

export const projectPaginateConfig: PaginateConfig<Project> = {
  sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: true,
  },
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Project>> {
    return paginate(query, this.projectRepository, {
      ...projectPaginateConfig,
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project | null> {
    const project = await this.findOne(id);

    if (!project) {
      return null;
    }

    Object.assign(project, updateProjectDto);

    project.updatedAt = new Date();
    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<boolean> {
    const project = await this.findOne(id);
    if (!project) {
      return false;
    }

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.update(Project, { id }, { deletedAt: now });
      await manager.update(
        Note,
        { projectId: id, deletedAt: IsNull() },
        { deletedAt: now },
      );
      await manager.update(
        Tag,
        { projectId: id, deletedAt: IsNull() },
        { deletedAt: now },
      );
    });

    return true;
  }
}
