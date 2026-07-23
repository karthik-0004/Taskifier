import { ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateActivityEventDto } from './create-activity.dto';

export class CreateActivityEventsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateActivityEventDto)
  @ArrayMinSize(1)
  events: CreateActivityEventDto[];
}
