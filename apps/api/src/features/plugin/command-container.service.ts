import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import { spawn } from 'node:child_process';
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

@Injectable()
export class CommandContainer {
  private readonly logger = new Logger(CommandContainer.name);

  async runCommand(argv: string[]): Promise<string> {
    if (argv.length === 0) {
      throw new Error('Cannot run an empty command');
    }

    const displayCommand = formatCommand(argv);
    this.logger.log(`Executing command: ${displayCommand}`);

    try {
      const { stdout, stderr } = await this.exec([
        'exec',
        CONTAINER_NAME,
        ...argv,
      ]);

      this.logger.log(`Command succeeded (${stdout.length} bytes output)`);
      return stdout || stderr || `No output returned from ${displayCommand}`;
    } catch (error) {
      this.logger.error(`Command failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private exec(
    runtimeArgs: string[],
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(CONTAINER_RUNTIME, runtimeArgs, {
        timeout: COMMAND_TIMEOUT_MS,
      }) as any;

      let stdoutAccumulator = '';
      let stderrAccumulator = '';

      if (child.stdout) {
        child.stdout.on('data', (data: Buffer | string) => {
          const chunk = data.toString();
          stdoutAccumulator += chunk;
          
          // Stream output to logger line-by-line
          const lines = chunk.split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              this.logger.log(`[stdout] ${line}`);
            }
          });

          if (stdoutAccumulator.length > COMMAND_MAX_BUFFER_BYTES) {
            child.kill();
            reject(new Error(`Command output exceeded maximum buffer size of ${COMMAND_MAX_BUFFER_BYTES} bytes`));
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer | string) => {
          const chunk = data.toString();
          stderrAccumulator += chunk;

          const lines = chunk.split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              this.logger.warn(`[stderr] ${line}`);
            }
          });
        });
      }

      child.on('error', (error: Error) => {
        if ((error as any).code === 'ENOENT') {
          reject(
            new ServiceUnavailableException(
              `Container runtime '${CONTAINER_RUNTIME}' is not available in this environment, so plugin commands cannot be executed.`,
            ),
          );
        } else {
          reject(error);
        }
      });

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve({ stdout: stdoutAccumulator, stderr: stderrAccumulator });
        } else {
          // A non-zero exit is still useful output (nmap reports errors on stderr),
          // so surface it rather than discarding it.
          reject(new Error(stderrAccumulator.trim() || `Process exited with code ${code}`));
        }
      });
    });
  }
}
