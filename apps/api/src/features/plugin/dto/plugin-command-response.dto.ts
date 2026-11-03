import { ApiProperty } from '@nestjs/swagger';

export class PluginCommandResponseDto {
  @ApiProperty({
    description: 'The command string that the plugin would execute',
    example: 'nmap -sV 1.2.3.4',
  })
  command: string;
}
