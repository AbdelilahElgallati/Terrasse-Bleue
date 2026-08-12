import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '../../../../prisma/generated/client/enums';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';

@Roles(Role.CUSTOMER)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }
  @Get() findAll(@CurrentUser() user: AuthUser, @Query() query: ListOrdersDto) {
    return this.orders.findAll(user.id, query);
  }
  @Get(':id') findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.findOne(user.id, id);
  }
  @Get(':id/status') status(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.status(user.id, id);
  }
  @Post(':id/cancel') cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.cancel(user.id, id);
  }
}
