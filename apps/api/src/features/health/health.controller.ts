import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type HealthResponseDto = {
  status: 'ok';
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Health check used by the frontend to verify the API (and its database connection) is reachable',
  })
  @ApiResponse({
    status: 200,
    description: 'The API and database are healthy.',
  })
  @ApiResponse({
    status: 503,
    description: 'The API is up but the database is unreachable.',
  })
  async check(): Promise<HealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException(
        'Database connection is not available',
      );
    }
    return { status: 'ok' };
  }
}
