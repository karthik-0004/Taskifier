import { IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignEmployeeDto {
  @IsNotEmpty()
  employeeId: string;

  @IsOptional()
  role?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  workload?: number;

  @IsOptional()
  joiningDate?: string;
}
