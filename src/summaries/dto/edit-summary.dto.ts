import { IsString, MinLength } from 'class-validator';

export class EditSummaryDto {
  @IsString()
  @MinLength(1)
  editedContent: string;
}
