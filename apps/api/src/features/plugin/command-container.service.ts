import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { execFile } from 'node:child_process';
import { formatCommand } from './plugin.interface';

/** Container runtime binary. TD-0.5 will make this configurable (blocked on OD-1). */
const CONTAINER_RUNTIME = 'podman';

/** Name of the sibling tooling container commands are executed inside. */
const CONTAINER_NAME = 'intel-view-kali';

/** Hard ceiling on a single command's wall-clock runtime. */
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Output cap. The Node default is 1 MiB, which silently truncates and then
 * errors on a full-port `nmap` run.
 */
const COMMAND_MAX_BUFFER_BYTES = 16 * 1024 * 1024;

type ExecFileError = Error & { code?: string | number };

/**
 * Runs a command inside the sibling tooling container.
 *
 * Commands are passed as an argv array to `execFile`, which calls `execvp`
 * directly — no shell is spawned, so shell metacharacters (`;`, `|`, `$()`,
 * backticks, newlines) in any element are inert and arrive at the program as
 * literal characters. Never reintroduce string interpolation or `shell: true`
 * here: `argv` is reachable from unauthenticated, user-controlled note content.
 */
@Injectable()
export class CommandContainer {
  async runCommand(argv: string[]): Promise<string> {
    if (argv.length === 0) {
      throw new Error('Cannot run an empty command');
    }

    const displayCommand = formatCommand(argv);

    const { stdout, stderr } = await this.exec([
      'exec',
      CONTAINER_NAME,
      ...argv,
    ]);

    return stdout || stderr || `No output returned from ${displayCommand}`;
  }

  private exec(
    runtimeArgs: string[],
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      execFile(
        CONTAINER_RUNTIME,
        runtimeArgs,
        {
          timeout: COMMAND_TIMEOUT_MS,
          maxBuffer: COMMAND_MAX_BUFFER_BYTES,
          encoding: 'utf8',
        },
        (error, stdout, stderr) => {
          if (!error) {
            resolve({ stdout, stderr });
            return;
          }

          if ((error as ExecFileError).code === 'ENOENT') {
            reject(
              new ServiceUnavailableException(
                `Container runtime '${CONTAINER_RUNTIME}' is not available in this environment, so plugin commands cannot be executed.`,
              ),
            );
            return;
          }

          // A non-zero exit is still useful output (nmap reports errors on
          // stderr), so surface it rather than discarding it.
          reject(new Error(stderr?.trim() || error.message));
        },
      );
    });
  }
}
