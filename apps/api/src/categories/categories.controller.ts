import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { CategoriesService } from './categories.service';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() findAll() {
    return this.categories.findAll();
  }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.findOne(id);
  }
}
