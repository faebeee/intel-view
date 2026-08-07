import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ProjectAccessService } from '../project/project-access.service';

export const tagPaginateConfig: PaginateConfig<Tag> = {
  sortableColumns: ['id', 'name', 'color', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name'],
  filterableColumns: {
    name: true,
    color: true,
  },
};

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(projectId: number, createTagDto: CreateTagDto): Promise<Tag> {
    await this.projectAccessService.assertExists(projectId);
    const tag = this.tagRepository.create({ ...createTagDto, projectId });
    return this.tagRepository.save(tag);
  }

  async findAll(
    projectId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Tag>> {
    await this.projectAccessService.assertExists(projectId);
    return paginate(query, this.tagRepository, {
      ...tagPaginateConfig,
      where: { deletedAt: IsNull(), projectId },
    });
  }

  async findOne(projectId: number, id: number): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });
  }

  async update(
    projectId: number,
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<Tag | null> {
    const tag = await this.tagRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });

    if (!tag) {
      return null;
    }

    // Update primitive fields
    Object.assign(tag, updateTagDto);

    tag.updatedAt = new Date();
    return this.tagRepository.save(tag);
  }

  async remove(projectId: number, id: number): Promise<boolean> {
    const tag = await this.findOne(projectId, id);
    if (!tag) {
      return false;
    }
    const result = await this.tagRepository.update(
      { id, projectId },
      { deletedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }
}
