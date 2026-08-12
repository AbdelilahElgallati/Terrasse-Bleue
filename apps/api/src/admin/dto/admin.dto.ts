import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  OrderStatus,
  Role,
} from '../../../../../prisma/generated/client/enums';

export class AdminOrdersQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 30;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
}

export class CreateCategoryDto {
  @IsString() @Length(2, 100) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(2_800_000) imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(2_800_000) imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}

export class AdminProductsQueryDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  available?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}

export class CreateProductDto {
  @IsUUID() categoryId!: string;
  @IsString() @Length(2, 140) name!: string;
  @IsString() @Length(2, 2000) description!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
  @IsOptional() @IsString() @MaxLength(2_800_000) imageUrl?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @Length(2, 140) name?: string;
  @IsOptional() @IsString() @Length(2, 2000) description?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
  @IsOptional() @IsString() @MaxLength(2_800_000) imageUrl?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class CreateOptionValueDto {
  @IsString() @Length(1, 100) label!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) priceDelta = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateProductOptionDto {
  @IsString() @Length(1, 100) name!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionValueDto)
  values?: CreateOptionValueDto[];
}

export class UpdateProductOptionDto {
  @IsOptional() @IsString() @Length(1, 100) name?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateOptionValueDto {
  @IsOptional() @IsString() @Length(1, 100) label?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceDelta?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateRestaurantSettingsDto {
  @IsOptional() @IsString() @Length(2, 100) restaurantName?: string;
  @IsOptional() @IsString() @Length(2, 255) address?: string;
  @IsOptional() @IsString() @MaxLength(30) contactPhone?: string;
  @IsOptional() @IsEmail() @MaxLength(255) contactEmail?: string;
  @IsOptional() @IsBoolean() isOpen?: boolean;
  @IsOptional() @IsBoolean() acceptsOrders?: boolean;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(180)
  estimatedPrepMinutes?: number;
  @IsOptional() @IsBoolean() notificationSound?: boolean;
}

export class CreateStaffDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.',
  })
  password!: string;
  @IsEnum(Role) role!: Role;
}

export class UpdateStaffRoleDto {
  @IsEnum(Role) role!: Role;
}
