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
import { ProjectFolderService } from '../project-folder/project-folder.service';

export const projectPaginateConfig: PaginateConfig<Project> = {
  sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: true,
    folderId: true,
  },
  relations: ['folder'],
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly projectFolderService: ProjectFolderService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    if (createProjectDto.folderId != null) {
      await this.projectFolderService.assertExists(createProjectDto.folderId);
    }

    const project = this.projectRepository.create(createProjectDto);
    const createdProject = await this.projectRepository.save(project);

    const reloadedProject = await this.findOne(createdProject.id);
    return reloadedProject ?? createdProject;
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
      relations: { folder: true },
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

    if (updateProjectDto.folderId != null) {
      await this.projectFolderService.assertExists(updateProjectDto.folderId);
    }

    Object.assign(project, updateProjectDto);

    project.updatedAt = new Date();
    const saved = await this.projectRepository.save(project);

    return this.findOne(saved.id);
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
    });

    return true;
  }
}
