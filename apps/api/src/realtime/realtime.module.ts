import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrderEventsGateway } from './order-events.gateway';

@Module({
  imports: [JwtModule.register({})],
  providers: [OrderEventsGateway],
  exports: [OrderEventsGateway],
})
export class RealtimeModule {}
