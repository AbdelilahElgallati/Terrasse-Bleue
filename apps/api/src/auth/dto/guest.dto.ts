import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class GuestDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
