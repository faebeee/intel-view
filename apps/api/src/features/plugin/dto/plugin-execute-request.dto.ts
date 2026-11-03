import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class PluginExecuteRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The command to execute using the plugin',
    example: 'example-domain.com',
  })
  command: string;
}
