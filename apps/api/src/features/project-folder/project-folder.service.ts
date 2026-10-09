import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { ProjectFolder } from './entities/project-folder.entity';
import { CreateProjectFolderDto } from './dto/create-project-folder.dto';
import { UpdateProjectFolderDto } from './dto/update-project-folder.dto';
import { Project } from '../project/entities/project.entity';

export type ProjectCountsByFolder = {
  countsByFolderId: Map<number, number>;
  ungroupedCount: number;
};

export const projectFolderPaginateConfig: PaginateConfig<ProjectFolder> = {
  sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: true,
  },
};

@Injectable()
export class ProjectFolderService {
  constructor(
    @InjectRepository(ProjectFolder)
    private readonly projectFolderRepository: Repository<ProjectFolder>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createProjectFolderDto: CreateProjectFolderDto,
  ): Promise<ProjectFolder> {
    const folder = this.projectFolderRepository.create(createProjectFolderDto);
    return this.projectFolderRepository.save(folder);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<ProjectFolder>> {
    return paginate(query, this.projectFolderRepository, {
      ...projectFolderPaginateConfig,
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<ProjectFolder | null> {
    return this.projectFolderRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * Counts active projects grouped by folder in a single query, used by the
   * controller to annotate each folder with `projectsCount` on the dashboard
   * and to surface the count of unassigned ("ungrouped") projects.
   */
  async countProjectsByFolder(): Promise<ProjectCountsByFolder> {
    const rows = await this.projectRepository
      .createQueryBuilder('project')
      .select('project.folderId', 'folderId')
      .addSelect('COUNT(*)', 'count')
      .where('project.deletedAt IS NULL')
      .groupBy('project.folderId')
      .getRawMany<{ folderId: number | null; count: string }>();

    const countsByFolderId = new Map<number, number>();
    let ungroupedCount = 0;

    for (const row of rows) {
      const count = Number(row.count);
      if (row.folderId == null) {
        ungroupedCount = count;
      } else {
        countsByFolderId.set(row.folderId, count);
      }
    }

    return { countsByFolderId, ungroupedCount };
  }

  /**
   * Confirms a project folder exists and is active. Used by ProjectService to
   * validate a `folderId` before assigning it to a project.
   */
  async assertExists(id: number): Promise<void> {
    const folder = await this.findOne(id);
    if (!folder) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
  }

  async update(
    id: number,
    updateProjectFolderDto: UpdateProjectFolderDto,
  ): Promise<ProjectFolder | null> {
    const folder = await this.findOne(id);

    if (!folder) {
      return null;
    }

    Object.assign(folder, updateProjectFolderDto);

    folder.updatedAt = new Date();
    return this.projectFolderRepository.save(folder);
  }

  /**
   * Soft deletes the folder and unassigns (sets folderId to null on) any
   * active projects that belonged to it, in a single transaction.
   */
  async remove(id: number): Promise<boolean> {
    const folder = await this.findOne(id);
    if (!folder) {
      return false;
    }

    await this.dataSource.transaction(async (manager) => {
      const now = new Date();
      await manager.update(ProjectFolder, { id }, { deletedAt: now });
      await manager.update(
        Project,
        { folderId: id, deletedAt: IsNull() },
        { folderId: null },
      );
    });

    return true;
  }
}
