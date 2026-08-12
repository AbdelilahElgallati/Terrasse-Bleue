import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  OrderType,
  PaymentMethod,
} from '../../../../../prisma/generated/client/enums';
import { IsUuidRecord } from '../../common/is-uuid-record.decorator';

export class CreateOrderItemDto {
  @IsUUID() productId!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(20) quantity!: number;
  @IsOptional()
  @IsObject()
  @IsUuidRecord()
  selectedOptions?: Record<string, string>;
}
export class DeliveryAddressDto {
  @IsString() @MinLength(2) @MaxLength(100) recipientName!: string;
  @IsString() @MinLength(8) @MaxLength(20) phone!: string;
  @IsString() @MinLength(8) @MaxLength(180) addressLine!: string;
  @IsOptional() @IsString() @MaxLength(80) neighborhood?: string;
  @IsOptional() @IsString() @MaxLength(120) landmark?: string;
  @IsOptional() @IsString() @MaxLength(240) instructions?: string;
  @IsString() @MinLength(2) @MaxLength(40) city!: string;
}
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
  @IsEnum(OrderType) orderType!: OrderType;
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
