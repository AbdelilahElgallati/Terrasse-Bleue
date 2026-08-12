import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';
export class RegisterDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() @MaxLength(255) email!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'Le mot de passe doit contenir majuscule, minuscule, chiffre et symbole.',
  })
  password!: string;
}
