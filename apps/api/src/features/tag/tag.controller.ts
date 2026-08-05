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
import { Tag } from './entities/tag.entity';

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: 201,
    description: 'The tag has been successfully created.',
    type: Tag,
  })
  async create(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active tags with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(tagPaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active tags paginated.',
  })
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Tag>> {
    return this.tagService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tag by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the tag with the specified ID.',
    type: Tag,
  })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tag> {
    const tag = await this.tagService.findOne(id);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag by ID' })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully updated.',
    type: Tag,
  })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    const tag = await this.tagService.update(id, updateTagDto);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
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
