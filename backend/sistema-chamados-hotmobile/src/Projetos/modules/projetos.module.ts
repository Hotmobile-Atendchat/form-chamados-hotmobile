/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from 'src/prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { MailService } from 'src/Ticket/services/mail.service';
import { WhatsappService } from 'src/Ticket/services/whatsapp.service';
import { ProjetosController } from '../controllers/projetos.controller';
import { ProjetosService } from '../services/projetos.service';

@Module({
  imports: [HttpModule],
  controllers: [ProjetosController],
  providers: [
    ProjetosService,
    PrismaService,
    MailService,
    WhatsappService,
    {
      provide: 'STORAGE_SERVICE',
      useClass: SupabaseService,
    },
  ],
})
export class ProjetosModule {}
