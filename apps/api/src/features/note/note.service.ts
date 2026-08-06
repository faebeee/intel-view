import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Note } from './entities/note.entity';
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
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const note = this.noteRepository.create(createNoteDto);
    return this.noteRepository.save(note);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Note>> {
    return paginate(query, this.noteRepository, {
      ...notePaginateConfig,
      where: { deletedAt: IsNull() },
    });
  }

  async findOne(id: number): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!note) {
      return null;
    }

    // Update primitive fields
    Object.assign(note, updateNoteDto);

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
