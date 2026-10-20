import { Sha256HashPlugin } from './sha256-hash.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('Sha256HashPlugin', () => {
  let plugin: Sha256HashPlugin;

  beforeEach(() => {
    plugin = new Sha256HashPlugin();
  });

  it('should generate the correct command for a given fileName', () => {
    const note = { fileName: 'hashme.txt' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('sha256sum "hashme.txt"');
  });

  it('should fallback to file.ext if fileName is missing', () => {
    const note = { fileName: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('sha256sum "file.ext"');
  });
});
