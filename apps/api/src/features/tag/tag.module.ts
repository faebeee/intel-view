import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule implements OnModuleInit {
  constructor(private readonly tagService: TagService) {}

  /**
   * Ensures the default penetration-test-stage tags exist every time the
   * application starts, so every environment has a sensible baseline set of
   * tags without any manual seeding step.
   */
  async onModuleInit(): Promise<void> {
    await this.tagService.ensureDefaultTagsExist();
  }
}
