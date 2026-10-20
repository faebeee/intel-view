import { SubdomainEnumSubfinderPlugin } from './subdomain-enum-subfinder.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('SubdomainEnumSubfinderPlugin', () => {
  let plugin: SubdomainEnumSubfinderPlugin;

  beforeEach(() => {
    plugin = new SubdomainEnumSubfinderPlugin();
  });

  it('should extract hostname from a full URL', () => {
    const note = { content: 'https://www.example.com/path' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('subfinder -d www.example.com -silent');
  });

  it('should use raw content if URL is invalid', () => {
    const note = { content: 'invalid-url' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('subfinder -d invalid-url -silent');
  });

  it('should fallback to example.com if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('subfinder -d example.com -silent');
  });
});
