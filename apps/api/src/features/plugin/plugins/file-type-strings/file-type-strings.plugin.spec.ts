import { FileTypeStringsPlugin } from './file-type-strings.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('FileTypeStringsPlugin', () => {
  let plugin: FileTypeStringsPlugin;

  beforeEach(() => {
    plugin = new FileTypeStringsPlugin();
  });

  it('should generate the correct command for a given fileName', () => {
    const note = { fileName: 'binary.exe' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe(
      'file "binary.exe" && strings "binary.exe" | less',
    );
  });

  it('should fallback to file.ext if fileName is missing', () => {
    const note = { fileName: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe(
      'file "file.ext" && strings "file.ext" | less',
    );
  });
});
