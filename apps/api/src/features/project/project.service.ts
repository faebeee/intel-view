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
import { ProjectGroupService } from '../project-group/project-group.service';

export const projectPaginateConfig: PaginateConfig<Project> = {
  sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: true,
    groupId: true,
  },
  relations: ['group', 'tags'],
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly projectGroupService: ProjectGroupService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    if (createProjectDto.groupId != null) {
      await this.projectGroupService.assertExists(createProjectDto.groupId);
    }

    const { tags = [], ...projectData } = createProjectDto;

    const savedProject = await this.dataSource.transaction(
      async (manager): Promise<Project> => {
        const project = manager.create(Project, projectData);
        const createdProject = await manager.save(Project, project);

        const uniqueTags = this.normalizeTags(tags);
        if (uniqueTags.length > 0) {
          const tagEntities = uniqueTags.map((name) =>
            manager.create(Tag, {
              projectId: createdProject.id,
              name,
              color: '#00f2ff',
            }),
          );
          await manager.save(Tag, tagEntities);
        }

        return createdProject;
      },
    );

    const reloadedProject = await this.findOne(savedProject.id);
    return reloadedProject ?? savedProject;
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
      relations: { group: true, tags: true },
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

    if (updateProjectDto.groupId != null) {
      await this.projectGroupService.assertExists(updateProjectDto.groupId);
    }

    const { tags, ...projectData } = updateProjectDto;
    Object.assign(project, projectData);

    project.updatedAt = new Date();
    const saved = await this.projectRepository.save(project);

    if (tags !== undefined) {
      await this.dataSource.transaction(async (manager) => {
        await manager.update(
          Tag,
          { projectId: saved.id, deletedAt: IsNull() },
          { deletedAt: new Date() },
        );

        const uniqueTags = this.normalizeTags(tags);
        if (uniqueTags.length === 0) {
          return;
        }

        const tagEntities = uniqueTags.map((name) =>
          manager.create(Tag, {
            projectId: saved.id,
            name,
            color: '#00f2ff',
          }),
        );
        await manager.save(Tag, tagEntities);
      });
    }

    return this.findOne(saved.id);
  }

  private normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
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
