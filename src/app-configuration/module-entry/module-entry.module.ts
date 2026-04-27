import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleEntry } from './entity/module-entry.entity';
import { ModuleEntryController } from './module-entry.controller';
import { ModuleEntryService } from './module-entry.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleEntry])],
  controllers: [ModuleEntryController],
  providers: [ModuleEntryService],
  exports: [ModuleEntryService],
})
export class ModuleEntryModule {}
