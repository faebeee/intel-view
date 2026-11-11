import { BadRequestException } from '@nestjs/common';
import { isIP } from 'node:net';
import type { Note } from '../note/entities/note.entity';

/**
 * Note types whose content is used as a command argument and therefore must be
 * validated before it reaches a plugin.
 */
const VALIDATED_NOTE_TYPES: Record<string, (content: string) => boolean> = {
  ip: (content) => isIP(content) !== 0,
};

/**
 * Defence in depth behind the `execFile` argv boundary.
 *
 * The argv array already prevents shell injection. This guard additionally
 * prevents *flag* injection — content such as `--script=http-vuln` or
 * `-oN /etc/cron.d/x` is a single, shell-safe argv element, but nmap would
 * still parse it as an option. Constraining an `ip` note's content to an
 * actual IP address closes that.
 *
 * Throws `BadRequestException` when the note's content is invalid for its type.
 * Note types without a registered validator are passed through unchanged.
 */
export function assertExecutableNote(note: Note): void {
  const isValid = VALIDATED_NOTE_TYPES[note.type];
  if (!isValid) {
    return;
  }

  if (!isValid(note.content?.trim() ?? '')) {
    throw new BadRequestException(
      `Note ${note.id} cannot be used to execute a plugin: its content is not a valid ${note.type} value.`,
    );
  }
}
