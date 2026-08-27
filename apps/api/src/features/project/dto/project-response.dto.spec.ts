import { toProjectResponseDto } from './project-response.dto';
import { Project } from '../entities/project.entity';

describe('toProjectResponseDto', () => {
  function buildProject(overrides: Partial<Project> = {}): Project {
    return {
      id: 1,
      name: 'Op Blue Horizon',
      description: null,
      groupId: null,
      group: null,
      mapTheme: 'street',
      color: 'ocean',
      tags: [],
      notes: [],
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      deletedAt: null,
      ...overrides,
    } as Project;
  }

  it('excludes soft-deleted tags from the mapped response', () => {
    const project = buildProject({
      tags: [
        {
          id: 1,
          name: 'active-tag',
          color: '#00f2ff',
          projectId: 1,
          deletedAt: null,
        },
        {
          id: 2,
          name: 'old-tag',
          color: '#00f2ff',
          projectId: 1,
          // Soft-deleted (e.g. replaced by a project update) but still
          // present on the loaded `tags` relation, which does not filter by
          // `deletedAt` at the query level.
          deletedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ] as Project['tags'],
    });

    const result = toProjectResponseDto(project);

    expect(result.tags).toEqual([
      { id: 1, name: 'active-tag', color: '#00f2ff' },
    ]);
  });

  it('returns an empty tags array when no tags are present', () => {
    const project = buildProject({ tags: undefined });

    const result = toProjectResponseDto(project);

    expect(result.tags).toEqual([]);
  });
});
