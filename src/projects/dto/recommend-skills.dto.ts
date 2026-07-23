import { IsNotEmpty } from 'class-validator';

export class RecommendSkillsDto {
  @IsNotEmpty()
  description: string;
}
