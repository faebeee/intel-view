import { MasscanFastPortScanPlugin } from './masscan-fast-port-scan.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('MasscanFastPortScanPlugin', () => {
  let plugin: MasscanFastPortScanPlugin;

  beforeEach(() => {
    plugin = new MasscanFastPortScanPlugin();
  });

  it('should generate the correct command for a given IP', () => {
    const note = { content: '1.1.1.1' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe(
      'sudo masscan -p1-65535 1.1.1.1 --rate=1000',
    );
  });

  it('should fallback to 127.0.0.1 if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe(
      'sudo masscan -p1-65535 127.0.0.1 --rate=1000',
    );
  });
});
