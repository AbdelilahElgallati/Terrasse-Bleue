import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '../../../../prisma/generated/client/enums';
import type { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { Public } from '../common/public.decorator';
import { AdminService } from './admin.service';
import {
  AdminOrdersQueryDto,
  AdminProductsQueryDto,
  CreateCategoryDto,
  CreateOptionValueDto,
  CreateProductDto,
  CreateStaffDto,
  CreateProductOptionDto,
  UpdateCategoryDto,
  UpdateOptionValueDto,
  UpdateOrderStatusDto,
  UpdateProductDto,
  UpdateProductOptionDto,
  UpdateRestaurantSettingsDto,
  UpdateStaffRoleDto,
} from './dto/admin.dto';

const privileged = [Role.ADMIN, Role.MANAGER] as const;

@Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard') dashboard() {
    return this.admin.dashboard();
  }
  @Get('orders') orders(@Query() query: AdminOrdersQueryDto) {
    return this.admin.orders(query);
  }
  @Get('orders/:id') order(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.order(id);
  }
  @Patch('orders/:id/status') updateOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.admin.updateOrderStatus(id, dto.status, user.id);
  }

  @Get('categories') categories() {
    return this.admin.categories();
  }
  @Roles(...privileged) @Post('categories') createCategory(
    @Body() dto: CreateCategoryDto,
  ) {
    return this.admin.createCategory(dto);
  }
  @Roles(...privileged) @Patch('categories/:id') updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.admin.updateCategory(id, dto);
  }

  @Get('products') products(@Query() query: AdminProductsQueryDto) {
    return this.admin.products(query);
  }
  @Get('products/:id') product(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.product(id);
  }
  @Roles(...privileged) @Post('products') createProduct(
    @Body() dto: CreateProductDto,
  ) {
    return this.admin.createProduct(dto);
  }
  @Roles(...privileged) @Patch('products/:id') updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.admin.updateProduct(id, dto);
  }
  @Roles(...privileged) @Post('products/:id/options') createProductOption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductOptionDto,
  ) {
    return this.admin.createProductOption(id, dto);
  }
  @Roles(...privileged) @Patch('options/:id') updateProductOption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductOptionDto,
  ) {
    return this.admin.updateProductOption(id, dto);
  }
  @Roles(...privileged) @Post('options/:id/values') createOptionValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOptionValueDto,
  ) {
    return this.admin.createOptionValue(id, dto);
  }
  @Roles(...privileged) @Patch('option-values/:id') updateOptionValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOptionValueDto,
  ) {
    return this.admin.updateOptionValue(id, dto);
  }

  @Get('customers') customers() {
    return this.admin.customers();
  }
  @Get('reports') reports() {
    return this.admin.reports();
  }
  @Get('settings') settings() {
    return this.admin.settings();
  }
  @Roles(...privileged) @Patch('settings') updateSettings(
    @Body() dto: UpdateRestaurantSettingsDto,
  ) {
    return this.admin.updateSettings(dto);
  }
  @Public() @Roles() @Get('restaurant') publicSettings() {
    return this.admin.settings();
  }
  @Roles(Role.ADMIN) @Get('staff') staff() {
    return this.admin.staff();
  }
  @Roles(Role.ADMIN) @Post('staff') createStaff(@Body() dto: CreateStaffDto) {
    return this.admin.createStaff(dto);
  }
  @Roles(Role.ADMIN) @Patch('staff/:id/role') updateStaffRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.admin.updateStaffRole(id, dto);
  }
}
