import {Module} from '@nestjs/common'; 
import {ReportesService} from './reportes.service';
import {ReportesController} from './reportes.controller';
import {PdfModule} from '../pdf/pdf.module';
import {CorreoModule} from '../correo/correo.module';


@Module({
    imports: [PdfModule, CorreoModule],
    controllers: [ReportesController],
    providers: [ReportesService],
})
export class ReportesModule {}