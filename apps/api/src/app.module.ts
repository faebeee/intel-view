import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteModule } from './features/note/note.module';
import { TagModule } from './features/tag/tag.module';
import { ProjectModule } from './features/project/project.module';
import { ProjectGroupModule } from './features/project-group/project-group.module';
import { DatabaseModule } from './features/database/database.module';
import { HealthModule } from './features/health/health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'intel_view',
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
    }),
    DatabaseModule,
    HealthModule,
    ProjectGroupModule,
    ProjectModule,
    NoteModule,
    TagModule,
  ],
})
export class AppModule {}
