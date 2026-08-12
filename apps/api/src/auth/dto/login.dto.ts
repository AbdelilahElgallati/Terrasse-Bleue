import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
export class LoginDto {
  @IsEmail() @MaxLength(255) email!: string;
  @IsString() @Length(8, 128) password!: string;
}
