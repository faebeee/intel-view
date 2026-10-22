import { NmapUdpScanPlugin } from './nmap-udp-scan.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('NmapUdpScanPlugin', () => {
  let plugin: NmapUdpScanPlugin;

  beforeEach(() => {
    plugin = new NmapUdpScanPlugin();
  });

  it('should generate the correct command for a given IP', () => {
    const note = { content: '1.1.1.1' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('sudo nmap -sU --top-ports 100 1.1.1.1');
  });

  it('should fallback to 127.0.0.1 if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe(
      'sudo nmap -sU --top-ports 100 127.0.0.1',
    );
  });
});
