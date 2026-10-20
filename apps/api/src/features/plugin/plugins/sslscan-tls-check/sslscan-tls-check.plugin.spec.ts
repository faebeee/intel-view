import { SslScanTlsCheckPlugin } from './sslscan-tls-check.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('SslScanTlsCheckPlugin', () => {
  let plugin: SslScanTlsCheckPlugin;

  beforeEach(() => {
    plugin = new SslScanTlsCheckPlugin();
  });

  it('should extract hostname from a full URL', () => {
    const note = { content: 'https://www.example.com/path' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('sslscan www.example.com');
  });

  it('should use raw content if URL is invalid', () => {
    const note = { content: 'invalid-url' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('sslscan invalid-url');
  });

  it('should fallback to example.com if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('sslscan example.com');
  });
});
