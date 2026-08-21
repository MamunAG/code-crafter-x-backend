import { IsEnum, IsOptional } from 'class-validator';
import { AuditModuleName } from '../audit.types';

export class AuditModuleScopeDto {
  @IsOptional()
  @IsEnum(AuditModuleName)
  moduleName?: AuditModuleName;
}
