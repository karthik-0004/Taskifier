import { IsEnum, IsObject, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityEventDto {
  @IsUUID()
  sessionId: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
