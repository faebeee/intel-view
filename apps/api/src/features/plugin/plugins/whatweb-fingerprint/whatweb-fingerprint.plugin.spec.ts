import { WhatWebFingerprintPlugin } from './whatweb-fingerprint.plugin';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

describe('WhatWebFingerprintPlugin', () => {
  let plugin: WhatWebFingerprintPlugin;

  beforeEach(() => {
    plugin = new WhatWebFingerprintPlugin();
  });

  it('should generate the correct command for a given URL', () => {
    const note = { content: 'https://example.com' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('whatweb https://example.com');
  });

  it('should fallback to example.com if content is missing', () => {
    const note = { content: '' } as NoteResponseDto;
    expect(plugin.preview(note)).toBe('whatweb https://example.com');
  });
});
