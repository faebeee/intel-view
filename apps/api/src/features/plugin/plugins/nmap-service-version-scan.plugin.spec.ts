import { NmapServiceVersionScanPlugin } from './nmap-service-version-scan.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('NmapServiceVersionScanPlugin', () => {
  let plugin: NmapServiceVersionScanPlugin;

  beforeEach(() => {
    plugin = new NmapServiceVersionScanPlugin();
  });

  it('should generate the correct command for a given IP', () => {
    const note = { content: '1.1.1.1' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('nmap -sV -sC -p- 1.1.1.1');
  });

  it('should fallback to 127.0.0.1 if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.execute(note)).toBe('nmap -sV -sC -p- 127.0.0.1');
  });
});
