import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Tag } from './entities/tag.entity';
import { Note } from '../note/entities/note.entity';
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

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { noteIds, ...tagData } = createTagDto;
    const tag = this.tagRepository.create(tagData);

    if (noteIds && noteIds.length > 0) {
      tag.notes = await this.noteRepository.find({
        where: { id: In(noteIds), deletedAt: IsNull() },
      });
    } else {
      tag.notes = [];
    }

    return this.tagRepository.save(tag);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Tag>> {
    return paginate(query, this.tagRepository, {
      ...tagPaginateConfig,
      where: { deletedAt: IsNull() },
      relations: ['notes'],
    });
  }

  async findOne(id: number): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { notes: true },
    });
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag | null> {
    const tag = await this.tagRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { notes: true },
    });

    if (!tag) {
      return null;
    }

    const { noteIds, ...tagData } = updateTagDto;

    // Update primitive fields
    Object.assign(tag, tagData);

    // Update relations if noteIds are provided
    if (noteIds !== undefined) {
      if (noteIds.length > 0) {
        tag.notes = await this.noteRepository.find({
          where: { id: In(noteIds), deletedAt: IsNull() },
        });
      } else {
        tag.notes = [];
      }
    }

    tag.updatedAt = new Date();
    return this.tagRepository.save(tag);
  }

  async remove(id: number): Promise<boolean> {
    const tag = await this.findOne(id);
    if (!tag) {
      return false;
    }
    const result = await this.tagRepository.update(id, {
      deletedAt: new Date(),
    });
    return (result.affected ?? 0) > 0;
  }
}
