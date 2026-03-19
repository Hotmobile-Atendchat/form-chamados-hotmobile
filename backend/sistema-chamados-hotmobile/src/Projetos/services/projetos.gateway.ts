import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ProjetosGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit() {
    console.log('Websocket Gateway de projetos iniciado!');
  }

  emitirNovoProjeto(projeto: any) {
    this.server.emit('novo_projeto', projeto);
  }

  emitirMudancaStatusProjeto(id: number, status: string) {
    this.server.emit('mudanca_status_projeto', { id, status });
  }
}
