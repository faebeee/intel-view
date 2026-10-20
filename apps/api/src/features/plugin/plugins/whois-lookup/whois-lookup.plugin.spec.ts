import { WhoisLookupPlugin } from './whois-lookup.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('WhoisLookupPlugin', () => {
  let plugin: WhoisLookupPlugin;

  beforeEach(() => {
    plugin = new WhoisLookupPlugin();
  });

  it('should generate the correct command for a given IP', () => {
    const note = { content: '1.1.1.1' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('whois 1.1.1.1');
  });

  it('should fallback to 127.0.0.1 if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('whois 127.0.0.1');
  });
});
