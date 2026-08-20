import { Module } from '@nestjs/common';
import { ExifController } from './exif.controller';
import { ExifService } from './exif.service';
import { NoteModule } from '../note/note.module';

@Module({
  imports: [NoteModule],
  controllers: [ExifController],
  providers: [ExifService],
})
export class AggregatorModule {}
