import { IsOptional, IsString, IsArray, IsObject } from 'class-validator';

export class CreateUpdateDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsArray()
  rawCommits: any[];

  @IsOptional()
  @IsString()
  manualNote?: string;

  @IsOptional()
  @IsString()
  aiEnhancedContent?: string;

  @IsString()
  finalContent: string;
}
