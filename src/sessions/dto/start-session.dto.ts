import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SessionSource } from '@prisma/client';

export class StartSessionDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsEnum(SessionSource)
  source: SessionSource;
}
