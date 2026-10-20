import { NiktoWebScanPlugin } from './nikto-web-scan.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('NiktoWebScanPlugin', () => {
  let plugin: NiktoWebScanPlugin;

  beforeEach(() => {
    plugin = new NiktoWebScanPlugin();
  });

  it('should generate the correct command for a given URL', () => {
    const note = { content: 'https://example.com' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('nikto -h https://example.com');
  });

  it('should fallback to example.com if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('nikto -h https://example.com');
  });
});
