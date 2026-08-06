import { Injectable, NotFoundException } from '@nestjs/common';
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
import { Project } from '../project/entities/project.entity';

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
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  private async assertProjectExists(projectId: number): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
  }

  async create(projectId: number, createNoteDto: CreateNoteDto): Promise<Note> {
    await this.assertProjectExists(projectId);
    const note = this.noteRepository.create({ ...createNoteDto, projectId });
    return this.noteRepository.save(note);
  }

  async findAll(
    projectId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Note>> {
    await this.assertProjectExists(projectId);
    return paginate(query, this.noteRepository, {
      ...notePaginateConfig,
      where: { deletedAt: IsNull(), projectId },
    });
  }

  async findOne(projectId: number, id: number): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });
  }

  async update(
    projectId: number,
    id: number,
    updateNoteDto: UpdateNoteDto,
  ): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });

    if (!note) {
      return null;
    }

    // Update primitive fields
    Object.assign(note, updateNoteDto);

    note.updatedAt = new Date();
    return this.noteRepository.save(note);
  }

  async remove(projectId: number, id: number): Promise<boolean> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return false;
    }
    const result = await this.noteRepository.update(
      { id, projectId },
      { deletedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }
}
