import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { ListProductsDto } from './dto/list-products.dto';
import { ProductsService } from './products.service';
@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() findAll(@Query() query: ListProductsDto) {
    return this.products.findAll(query);
  }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.findOne(id);
  }
}
