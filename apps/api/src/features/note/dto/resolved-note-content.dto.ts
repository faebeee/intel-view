import { ApiProperty } from '@nestjs/swagger';

/**
 * The result of recursively resolving a note's `[[NOTE_ID]]` transclusion
 * references into their referenced notes' content (see
 * `NoteService.resolveContent`).
 */
export class ResolvedNoteContentDto {
  @ApiProperty({
    description:
      "The note's content with every `[[NOTE_ID]]` reference recursively " +
      "replaced by the referenced note's own resolved content. References " +
      'to missing/out-of-project notes, circular references, and references ' +
      'beyond the maximum nesting depth are replaced with an inline error ' +
      'placeholder instead of being expanded.',
  })
  content: string;
}
