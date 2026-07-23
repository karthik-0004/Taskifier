import { IsOptional, IsDateString, IsUUID } from 'class-validator';

export class AttendanceQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
