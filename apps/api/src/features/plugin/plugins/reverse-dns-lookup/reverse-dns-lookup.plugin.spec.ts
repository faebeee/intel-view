import { ReverseDnsLookupPlugin } from './reverse-dns-lookup.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('ReverseDnsLookupPlugin', () => {
  let plugin: ReverseDnsLookupPlugin;

  beforeEach(() => {
    plugin = new ReverseDnsLookupPlugin();
  });

  it('should generate the correct command for a given IP', () => {
    const note = { content: '1.1.1.1' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('dig -x 1.1.1.1 +short');
  });

  it('should fallback to 127.0.0.1 if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('dig -x 127.0.0.1 +short');
  });
});
