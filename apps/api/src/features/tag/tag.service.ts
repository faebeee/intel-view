import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, QueryFailedError } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

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

/** Postgres error code for a unique constraint violation. */
const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as unknown as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
  );
}

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagRepository.create(createTagDto);
    try {
      return await this.tagRepository.save(tag);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A tag named "${createTagDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Tag>> {
    return paginate(query, this.tagRepository, {
      ...tagPaginateConfig,
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag | null> {
    const tag = await this.tagRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!tag) {
      return null;
    }

    // Update primitive fields
    Object.assign(tag, updateTagDto);

    tag.updatedAt = new Date();
    try {
      return await this.tagRepository.save(tag);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A tag named "${updateTagDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: number): Promise<boolean> {
    const tag = await this.findOne(id);
    if (!tag) {
      return false;
    }
    const result = await this.tagRepository.update(
      { id },
      { deletedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }
}
