import { ApiProperty } from '@nestjs/swagger';

export class PluginExecuteResponseDto {
  @ApiProperty({
    description: "The plugin's generated string result (e.g. a code snippet).",
  })
  result: string;
}
