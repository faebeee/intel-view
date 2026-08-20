import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VirtualNoteDto } from './dto/virtual-note.dto';
import { ExifService } from './exif.service';

@ApiTags('aggregator')
@Controller('projects/:projectId/aggregator/exif')
export class ExifController {
  constructor(private exifService: ExifService) {}

  @ApiQuery({
    name: 'note',
  })
  @Get('preview')
  @ApiOperation({ summary: 'Get exif data of a file attached to a note' })
  @ApiResponse({
    status: 200,
    description: 'Exif data extracted',
    type: VirtualNoteDto,
  })
  public async getPreview(
    @Param('projectId') projectId: string,
    @Query('note') noteId: string,
  ): Promise<VirtualNoteDto> {
    const note = await this.exifService.getVirtualNoteForNote(Number(noteId));
    note.title = 'EXIF Data Preview';
    note.projectId = parseInt(projectId); // Set to a default value or retrieve from context if needed
    return note;
  }
}
