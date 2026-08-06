import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
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
    parentId: true,
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

  /**
   * Validates that `parentId` refers to an existing, active note within the
   * same project, is not the note itself (`excludeId`), and does not create
   * a cycle in the note hierarchy.
   */
  private async assertParentValid(
    projectId: number,
    parentId: number,
    excludeId?: number,
  ): Promise<void> {
    if (parentId === excludeId) {
      throw new BadRequestException('A note cannot be its own parent');
    }

    const parent = await this.noteRepository.findOne({
      where: { id: parentId, projectId, deletedAt: IsNull() },
    });
    if (!parent) {
      throw new NotFoundException(
        `Parent note with ID ${parentId} not found in this project`,
      );
    }

    if (excludeId === undefined) {
      return;
    }

    // Walk up the ancestor chain of the proposed parent to ensure `excludeId`
    // (the note being created/updated) is not among its ancestors, which
    // would otherwise create a cycle.
    const allNotes = await this.noteRepository.find({
      where: { projectId, deletedAt: IsNull() },
      select: { id: true, parentId: true },
    });
    const parentById = new Map(allNotes.map((n) => [n.id, n.parentId]));

    let currentId: number | null = parentId;
    const visited = new Set<number>();
    while (currentId !== null && currentId !== undefined) {
      if (currentId === excludeId) {
        throw new BadRequestException(
          'Cannot set parent: this would create a circular note hierarchy',
        );
      }
      if (visited.has(currentId)) {
        break;
      }
      visited.add(currentId);
      currentId = parentById.get(currentId) ?? null;
    }
  }

  /**
   * Collects the IDs of all descendants (children, grandchildren, etc.) of
   * `rootId` within the given project, based on active (non-deleted) notes.
   */
  private async getDescendantIds(
    projectId: number,
    rootId: number,
  ): Promise<number[]> {
    const allNotes = await this.noteRepository.find({
      where: { projectId, deletedAt: IsNull() },
      select: { id: true, parentId: true },
    });

    const childrenByParent = new Map<number, number[]>();
    for (const n of allNotes) {
      if (n.parentId === null || n.parentId === undefined) continue;
      const siblings = childrenByParent.get(n.parentId) ?? [];
      siblings.push(n.id);
      childrenByParent.set(n.parentId, siblings);
    }

    const descendants: number[] = [];
    const queue: number[] = [...(childrenByParent.get(rootId) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      descendants.push(id);
      const children = childrenByParent.get(id) ?? [];
      queue.push(...children);
    }

    return descendants;
  }

  async create(projectId: number, createNoteDto: CreateNoteDto): Promise<Note> {
    await this.assertProjectExists(projectId);
    if (
      createNoteDto.parentId !== undefined &&
      createNoteDto.parentId !== null
    ) {
      await this.assertParentValid(projectId, createNoteDto.parentId);
    }
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

    if (
      updateNoteDto.parentId !== undefined &&
      updateNoteDto.parentId !== null
    ) {
      await this.assertParentValid(projectId, updateNoteDto.parentId, id);
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
    const descendantIds = await this.getDescendantIds(projectId, id);
    const idsToDelete = [id, ...descendantIds];
    const result = await this.noteRepository.update(
      { id: In(idsToDelete), projectId },
      { deletedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }
}
