import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Note } from './entities/note.entity';
import { Tag } from '../tag/entities/tag.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

export const notePaginateConfig: PaginateConfig<Note> = {
  sortableColumns: ['id', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['content'],
  filterableColumns: {
    content: true,
    lat: true,
    lng: true,
  },
};

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const { tagIds, ...noteData } = createNoteDto;
    const note = this.noteRepository.create(noteData);

    if (tagIds && tagIds.length > 0) {
      note.tags = await this.tagRepository.find({
        where: { id: In(tagIds), deletedAt: IsNull() },
      });
    } else {
      note.tags = [];
    }

    return this.noteRepository.save(note);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Note>> {
    return paginate(query, this.noteRepository, {
      ...notePaginateConfig,
      where: { deletedAt: IsNull() },
      relations: ['tags'],
    });
  }

  async findOne(id: number): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { tags: true },
    });
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { tags: true },
    });

    if (!note) {
      return null;
    }

    const { tagIds, ...noteData } = updateNoteDto;

    // Update primitive fields
    Object.assign(note, noteData);

    // Update relations if tagIds are provided
    if (tagIds !== undefined) {
      if (tagIds.length > 0) {
        note.tags = await this.tagRepository.find({
          where: { id: In(tagIds), deletedAt: IsNull() },
        });
      } else {
        note.tags = [];
      }
    }

    note.updatedAt = new Date();
    return this.noteRepository.save(note);
  }

  async remove(id: number): Promise<boolean> {
    const note = await this.findOne(id);
    if (!note) {
      return false;
    }
    const result = await this.noteRepository.update(id, {
      deletedAt: new Date(),
    });
    return (result.affected ?? 0) > 0;
  }
}
