import { IsEmail, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  position?: string;

  @IsOptional()
  profilePicture?: string;

  @IsOptional()
  githubUsername?: string;
}
