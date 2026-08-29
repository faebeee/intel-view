import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Paginate, Paginated, ApiPaginationQuery } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { TagService, tagPaginateConfig } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto, toTagResponseDto } from './dto/tag-response.dto';

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'The tag has been successfully created.',
    type: TagResponseDto,
  })
  async create(@Body() createTagDto: CreateTagDto): Promise<TagResponseDto> {
    const tag = await this.tagService.create(createTagDto);
    return toTagResponseDto(tag);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active tags with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(tagPaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active tags, paginated.',
  })
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<TagResponseDto>> {
    const paginated = await this.tagService.findAll(query);
    return {
      ...paginated,
      data: paginated.data.map(toTagResponseDto),
    } as unknown as Paginated<TagResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tag by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the tag with the specified ID.',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TagResponseDto> {
    const tag = await this.tagService.findOne(id);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return toTagResponseDto(tag);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag by ID' })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully updated.',
    type: TagResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    const tag = await this.tagService.update(id, updateTagDto);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return toTagResponseDto(tag);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a tag by ID' })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.tagService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return { message: `Tag with ID ${id} successfully deleted` };
  }
}
