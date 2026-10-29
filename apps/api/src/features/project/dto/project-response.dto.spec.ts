import { toProjectResponseDto } from './project-response.dto';
import { Project } from '../entities/project.entity';

describe('toProjectResponseDto', () => {
  function buildProject(overrides: Partial<Project> = {}): Project {
    return {
      id: 1,
      name: 'Op Blue Horizon',
      description: null,
      folderId: null,
      folder: null,
      color: 'ocean',
      notes: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      deletedAt: null,
      ...overrides,
    };
  }

  it('maps a project entity to its response DTO', () => {
    const project = buildProject();

    const result = toProjectResponseDto(project);

    expect(result).toEqual({
      id: 1,
      name: 'Op Blue Horizon',
      description: null,
      folderId: null,
      folder: null,
      color: 'ocean',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  });

  it('maps the folder relation when present', () => {
    const project = buildProject({
      folderId: 5,
      folder: { id: 5, name: 'Ops', color: '#00f2ff' } as Project['folder'],
    });

    const result = toProjectResponseDto(project);

    expect(result.folder).toEqual({ id: 5, name: 'Ops', color: '#00f2ff' });
  });
});
