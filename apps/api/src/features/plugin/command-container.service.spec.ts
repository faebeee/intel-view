import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execFile } from 'node:child_process';
import { CommandContainer } from './command-container.service';

jest.mock('node:child_process', () => ({
  execFile: jest.fn(),
}));

type ExecFileCallback = (
  error: (Error & { code?: string | number }) | null,
  stdout: string,
  stderr: string,
) => void;

type ExecFileOptions = { timeout: number; maxBuffer: number };

type ExecFileArgs = [string, string[], ExecFileOptions, ExecFileCallback];

const mockedExecFile = execFile as unknown as jest.Mock<void, ExecFileArgs>;

/** Resolves the next `execFile` call with the given streams. */
const resolveWith = (stdout: string, stderr = ''): void => {
  mockedExecFile.mockImplementation((_file, _args, _opts, cb) => {
    cb(null, stdout, stderr);
  });
};

/** Fails the next `execFile` call. */
const failWith = (
  error: Error & { code?: string | number },
  stderr = '',
): void => {
  mockedExecFile.mockImplementation((_file, _args, _opts, cb) => {
    cb(error, '', stderr);
  });
};

/** The arguments `execFile` was invoked with. */
const firstCall = (): ExecFileArgs => mockedExecFile.mock.calls[0];

/** The argv array `execFile` was invoked with. */
const calledArgs = (): string[] => firstCall()[1];

describe('CommandContainer', () => {
  let service: CommandContainer;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandContainer],
    }).compile();

    service = module.get<CommandContainer>(CommandContainer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shell injection (TD-0.1)', () => {
    it('passes argv as an array and never spawns a shell', async () => {
      resolveWith('scan output');

      await service.runCommand(['nmap', '-sV', '1.1.1.1']);

      expect(mockedExecFile).toHaveBeenCalledTimes(1);
      const [file, args, options] = firstCall();

      expect(file).toBe('podman');
      expect(Array.isArray(args)).toBe(true);
      // The whole command must never be handed over as a single string.
      expect(typeof args).not.toBe('string');
      expect(options).not.toHaveProperty('shell');
    });

    it('keeps shell metacharacters as a single literal argv element', async () => {
      resolveWith('scan output');
      const payload = '1.1.1.1; touch /tmp/pwned';

      await service.runCommand(['nmap', '-sV', '-p-', payload]);

      const args = calledArgs();
      expect(args).toEqual([
        'exec',
        'intel-view-kali',
        'nmap',
        '-sV',
        '-p-',
        payload,
      ]);
      // The payload is one argument: it is neither split on `;` nor merged
      // into a neighbouring element, so no second command can be formed.
      expect(args.filter((arg) => arg.includes('touch'))).toHaveLength(1);
      expect(args).not.toContain('touch');
    });

    it.each([
      ['command substitution', '$(touch /tmp/pwned)'],
      ['backticks', '`touch /tmp/pwned`'],
      ['pipe', '1.1.1.1 | sh'],
      ['newline', '1.1.1.1\ntouch /tmp/pwned'],
      ['logical and', '1.1.1.1 && touch /tmp/pwned'],
    ])(
      'passes %s through verbatim without interpretation',
      async (_, payload) => {
        resolveWith('');

        await service.runCommand(['nmap', payload]);

        expect(calledArgs()).toEqual([
          'exec',
          'intel-view-kali',
          'nmap',
          payload,
        ]);
      },
    );

    it('never interpolates the container name or runtime from input', async () => {
      resolveWith('');

      await service.runCommand(['nmap', '--version']);

      const [file, args] = firstCall();
      expect(file).toBe('podman');
      expect(args.slice(0, 2)).toEqual(['exec', 'intel-view-kali']);
    });
  });

  describe('flag injection (TD-0.3)', () => {
    it('does not itself reject flag-like arguments — that is the caller\u2019s job', async () => {
      resolveWith('');

      await service.runCommand(['nmap', '-oN', '/etc/cron.d/x']);

      // Documents the boundary: argv stops *shell* injection only. Rejecting
      // nmap flags smuggled in note content is `assertExecutableNote`'s
      // responsibility, covered in executable-note.validator.spec.ts.
      expect(calledArgs()).toContain('-oN');
    });
  });

  describe('execution options', () => {
    it('sets a timeout and a maxBuffer large enough for a full-port scan', async () => {
      resolveWith('');

      await service.runCommand(['nmap', '-p-', '1.1.1.1']);

      const options = firstCall()[2];
      expect(options.timeout).toBeGreaterThan(0);
      // Node's 1 MiB default truncates a full-port scan.
      expect(options.maxBuffer).toBeGreaterThan(1024 * 1024);
    });
  });

  describe('output handling', () => {
    it('returns stdout when present', async () => {
      resolveWith('PORT STATE SERVICE', 'warning: something');

      await expect(service.runCommand(['nmap', '1.1.1.1'])).resolves.toBe(
        'PORT STATE SERVICE',
      );
    });

    it('falls back to stderr when stdout is empty', async () => {
      resolveWith('', 'nmap: warning');

      await expect(service.runCommand(['nmap', '1.1.1.1'])).resolves.toBe(
        'nmap: warning',
      );
    });

    it('returns a descriptive fallback when both streams are empty', async () => {
      resolveWith('', '');

      await expect(service.runCommand(['nmap', '1.1.1.1'])).resolves.toBe(
        'No output returned from nmap 1.1.1.1',
      );
    });

    it('quotes unsafe characters in the fallback message rather than executing them', async () => {
      resolveWith('', '');

      const output = await service.runCommand(['nmap', '1.1.1.1; rm -rf /']);

      expect(output).toBe("No output returned from nmap '1.1.1.1; rm -rf /'");
    });
  });

  describe('failure handling', () => {
    it('rejects with stderr on a non-zero exit', async () => {
      const error = Object.assign(new Error('Command failed'), { code: 1 });
      failWith(error, 'nmap: unrecognised option\n');

      await expect(service.runCommand(['nmap', '--bogus'])).rejects.toThrow(
        'nmap: unrecognised option',
      );
    });

    it('falls back to the error message when stderr is empty', async () => {
      const error = Object.assign(new Error('Command failed: exit 2'), {
        code: 2,
      });
      failWith(error, '');

      await expect(service.runCommand(['nmap', '1.1.1.1'])).rejects.toThrow(
        'Command failed: exit 2',
      );
    });

    it('raises ServiceUnavailable when the container runtime is missing', async () => {
      const error = Object.assign(new Error('spawn podman ENOENT'), {
        code: 'ENOENT',
      });
      failWith(error);

      await expect(service.runCommand(['nmap', '1.1.1.1'])).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('rejects an empty argv without invoking the runtime', async () => {
      await expect(service.runCommand([])).rejects.toThrow(
        'Cannot run an empty command',
      );
      expect(mockedExecFile).not.toHaveBeenCalled();
    });
  });
});
