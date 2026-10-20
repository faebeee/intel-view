import { ExiftoolMetadataPlugin } from './exiftool-metadata.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('ExiftoolMetadataPlugin', () => {
  let plugin: ExiftoolMetadataPlugin;

  beforeEach(() => {
    plugin = new ExiftoolMetadataPlugin();
  });

  it('should generate the correct command for a given fileName', () => {
    const note = { fileName: 'image.jpg' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('exiftool "image.jpg"');
  });

  it('should fallback to file.ext if fileName is missing', () => {
    const note = { fileName: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('exiftool "file.ext"');
  });
});
