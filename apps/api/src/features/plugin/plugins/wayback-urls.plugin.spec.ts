import { WaybackUrlsPlugin } from './wayback-urls.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('WaybackUrlsPlugin', () => {
  let plugin: WaybackUrlsPlugin;

  beforeEach(() => {
    plugin = new WaybackUrlsPlugin();
  });

  it('should extract hostname from a full URL', () => {
    const note = { content: 'https://www.example.com/path' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('gau www.example.com');
  });

  it('should use raw content if URL is invalid', () => {
    const note = { content: 'invalid-url' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('gau invalid-url');
  });

  it('should fallback to example.com if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('gau example.com');
  });
});
