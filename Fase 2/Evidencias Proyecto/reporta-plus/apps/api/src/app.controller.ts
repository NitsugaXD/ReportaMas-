import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  // Test endpoint para enviar un correo de prueba
  /*
  @Public()
  @Get('test-mail')
  async sendTestMail() {
    console.log('[API] Recibido GET /test-mail');
    await this.mailService.sendServiceReport({
      to: ['nicobazan2233@gmail.com'],
      subject: '¡PRUEBA DESDE REPORTA+!',
      html: '<b>Esto es un test desde NestJS y Gmail SMTP</b>'
    });
    return 'Correo enviado!';
  }*/
}