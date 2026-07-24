import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ExtensionLoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  connectionKey: string;
}
