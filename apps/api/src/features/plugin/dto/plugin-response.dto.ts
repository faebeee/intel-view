import { ApiProperty } from '@nestjs/swagger';

export class PluginResponseDto {
  @ApiProperty({ description: 'Stable identifier of this plugin' })
  id: string;

  @ApiProperty({ description: "Human-readable label for this plugin's button" })
  label: string;
}
