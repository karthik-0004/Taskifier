import { IsUUID } from 'class-validator';

export class AssignEmployeeDto {
  @IsUUID()
  employeeId: string;
}
