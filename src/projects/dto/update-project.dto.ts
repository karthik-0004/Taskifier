import { IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, ProjectPriority, ProjectCategory } from '@prisma/client';

export class UpdateProjectDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  code?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  clientName?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  expectedEndDate?: string;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  teamLeadId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxTeamSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budget?: number;

  @IsOptional()
  techStack?: string;

  @IsOptional()
  requiredSkills?: string;

  @IsOptional()
  repoUrl?: string;

  @IsOptional()
  docsUrl?: string;

  @IsOptional()
  tags?: string;
}
