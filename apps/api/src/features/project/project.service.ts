import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { DEFAULT_PROJECT_STATUS, Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';
import { Note } from '../note/entities/note.entity';
import { NoteRelation } from '../note/entities/note-relation.entity';
import { NoteHistoryEntry } from '../note/entities/note-history-entry.entity';
import {
  containsNoteReference,
  remapNoteReferences,
} from '../note/note-references.util';
import { ProjectFolderService } from '../project-folder/project-folder.service';

export const projectPaginateConfig: PaginateConfig<Project> = {
  sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['name', 'description'],
  filterableColumns: {
    name: true,
    folderId: true,
    isTemplate: true,
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

  /**
   * Creates a project. With `templateId`, the template's notes are copied
   * into the new project (see `copyNotes`) in the same transaction, and the
   * template's color is used unless one was given. Templates themselves
   * (`isTemplate: true`) never belong to a folder.
   */
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { templateId, ...projectFields } = createProjectDto;
    const isTemplate = projectFields.isTemplate ?? false;

    if (!isTemplate && projectFields.folderId != null) {
      await this.projectFolderService.assertExists(projectFields.folderId);
    }

    const template =
      templateId != null ? await this.findTemplateOrFail(templateId) : null;

    const createdId = await this.dataSource.transaction(
      async (manager): Promise<number> => {
        const project = manager.create(Project, {
          ...projectFields,
          isTemplate,
          folderId: isTemplate ? null : (projectFields.folderId ?? null),
          color: projectFields.color ?? template?.color,
        });
        const saved = await manager.save(Project, project);
        if (template) {
          await this.copyNotes(manager, template.id, saved.id);
        }
        return saved.id;
      },
    );

    const reloadedProject = await this.findOne(createdId);
    if (!reloadedProject) {
      throw new NotFoundException(`Project with ID ${createdId} not found`);
    }
    return reloadedProject;
  }

  /**
   * Creates a new template from an existing project (or template): copies
   * its description, color and notes into a fresh template project. The
   * source project is left unchanged. Returns `null` when the source does
   * not exist.
   */
  async saveAsTemplate(
    id: number,
    dto: SaveAsTemplateDto,
  ): Promise<Project | null> {
    const source = await this.findOne(id);
    if (!source) {
      return null;
    }

    const createdId = await this.dataSource.transaction(
      async (manager): Promise<number> => {
        const template = manager.create(Project, {
          name: dto.name?.trim() || `${source.name} (template)`.slice(0, 150),
          description: source.description,
          color: source.color,
          folderId: null,
          status: DEFAULT_PROJECT_STATUS,
          isTemplate: true,
        });
        const saved = await manager.save(Project, template);
        await this.copyNotes(manager, source.id, saved.id);
        return saved.id;
      },
    );

    return this.findOne(createdId);
  }

  /**
   * Lists active projects. Templates are excluded unless the query filters
   * on `isTemplate` explicitly (e.g. `filter.isTemplate=$eq:true` lists only
   * templates).
   */
  async findAll(query: PaginateQuery): Promise<Paginated<Project>> {
    const where: FindOptionsWhere<Project> =
      query.filter?.isTemplate !== undefined
        ? { deletedAt: IsNull() }
        : { deletedAt: IsNull(), isTemplate: false };
    return paginate(query, this.projectRepository, {
      ...projectPaginateConfig,
      where,
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

  private async findTemplateOrFail(id: number): Promise<Project> {
    const template = await this.projectRepository.findOne({
      where: { id, isTemplate: true, deletedAt: IsNull() },
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    return template;
  }

  /**
   * Copies every active note of `sourceProjectId` into `targetProjectId`:
   * type, title, content, tags, color and canvas position, plus the
   * parent/child links between the copied notes. `[[NOTEID]]` references
   * to copied notes are rewritten to point at the copies. Uploaded files,
   * log entries and history are not copied; each copy gets a fresh
   * `'created'` history entry.
   */
  private async copyNotes(
    manager: EntityManager,
    sourceProjectId: number,
    targetProjectId: number,
  ): Promise<void> {
    const sourceNotes = await manager.find(Note, {
      where: { projectId: sourceProjectId, deletedAt: IsNull() },
      order: { id: 'ASC' },
    });
    if (sourceNotes.length === 0) {
      return;
    }

    const copies = await manager.save(
      Note,
      sourceNotes.map((note) =>
        manager.create(Note, {
          projectId: targetProjectId,
          type: note.type,
          title: note.title,
          content: note.content,
          tags: note.tags,
          color: note.color,
          canvasX: note.canvasX,
          canvasY: note.canvasY,
          version: note.version,
          fileKey: null,
          fileName: null,
          fileMimeType: null,
          fileSize: null,
        }),
      ),
    );

    const idMap = new Map<number, number>();
    sourceNotes.forEach((note, index) => idMap.set(note.id, copies[index].id));

    const withReferences = copies.filter(
      (copy) =>
        containsNoteReference(copy.title) ||
        containsNoteReference(copy.content),
    );
    if (withReferences.length > 0) {
      for (const copy of withReferences) {
        copy.title = copy.title && remapNoteReferences(copy.title, idMap);
        copy.content = copy.content && remapNoteReferences(copy.content, idMap);
      }
      await manager.save(Note, withReferences);
    }

    const relations = await manager.find(NoteRelation, {
      where: { parentId: In([...idMap.keys()]), deletedAt: IsNull() },
    });
    const copiedRelations = relations.flatMap((relation) => {
      const parentId = idMap.get(relation.parentId);
      const childId = idMap.get(relation.childId);
      return parentId !== undefined && childId !== undefined
        ? [manager.create(NoteRelation, { parentId, childId })]
        : [];
    });
    if (copiedRelations.length > 0) {
      await manager.save(NoteRelation, copiedRelations);
    }

    await manager.save(
      NoteHistoryEntry,
      copies.map((copy) =>
        manager.create(NoteHistoryEntry, {
          noteId: copy.id,
          changeType: 'created',
          changes: null,
        }),
      ),
    );
  }
}
