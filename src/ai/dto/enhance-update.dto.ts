import { IsArray, IsOptional, IsString } from 'class-validator';

export class EnhanceUpdateDto {
  @IsArray()
  rawCommits: any[];

  @IsOptional()
  @IsString()
  manualNote?: string;
}
