import { CurlHeadersSnippetPlugin } from './curl-headers-snippet.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('CurlHeadersSnippetPlugin', () => {
  let plugin: CurlHeadersSnippetPlugin;

  beforeEach(() => {
    plugin = new CurlHeadersSnippetPlugin();
  });

  it('should generate the correct command for a given URL', () => {
    const note = { content: 'https://example.com' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('curl -sI "https://example.com"');
  });

  it('should fallback to example.com if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('curl -sI "https://example.com"');
  });
});
