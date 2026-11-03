import { Injectable } from '@nestjs/common';

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execPromise = promisify(exec);

@Injectable()
export class CommandContainer {
  async runCommand(command: string): Promise<string> {
    const { stdout, stderr } = await execPromise(
      `podman run kali-rolling "${command}"`,
    );
    return stdout || stderr || `No output returned from ${command}`;
  }
}
