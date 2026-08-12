import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @Public()
  getHealth(): { status: string; service: string } {
    return this.appService.getHealth();
  }
}
