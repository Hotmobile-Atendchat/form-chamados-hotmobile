import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ProjetosService } from '../services/projetos.service';
import { CreateProjetoDto } from '../dtos/create-projeto.dto';
import { CreateProjetoSprintDto } from '../dtos/create-projeto-sprint.dto';
import { UpdateProjetoStatusDto } from '../dtos/update-projeto-status.dto';
import { UpdateProjetoSprintDto } from '../dtos/update-projeto-sprint.dto';
import { CreateProjetoTarefaDto } from '../dtos/create-projeto-tarefa.dto';
import { UpdateProjetoTarefaDto } from '../dtos/update-projeto-tarefa.dto';

@Controller('projetos')
export class ProjetosController {
  constructor(private readonly projetosService: ProjetosService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx|xls|xlsx|mp3|wav|webm|ogg)$/)) {
          return callback(new BadRequestException('Formato inválido! Permitido: Imagens, PDF e Áudio.'), false);
        }
        callback(null, true);
      },
    }),
  )
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Body() createProjetoDto: CreateProjetoDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.projetosService.create(createProjetoDto, files);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProjetoStatusDto,
  ) {
    return this.projetosService.updateStatus(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll() {
    return this.projetosService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('dashboard/metrics')
  async getMetrics(@Query('start') start?: string, @Query('end') end?: string) {
    return this.projetosService.getDashboardMetrics(start, end);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/sprints')
  async createSprint(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateProjetoSprintDto,
  ) {
    return this.projetosService.createSprint(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/sprints/:sprintId')
  async updateSprint(
    @Param('id', ParseIntPipe) id: number,
    @Param('sprintId', ParseIntPipe) sprintId: number,
    @Body() body: UpdateProjetoSprintDto,
  ) {
    return this.projetosService.updateSprint(id, sprintId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/sprints/:sprintId')
  async deleteSprint(
    @Param('id', ParseIntPipe) id: number,
    @Param('sprintId', ParseIntPipe) sprintId: number,
  ) {
    return this.projetosService.deleteSprint(id, sprintId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/tarefas')
  async createTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateProjetoTarefaDto,
    @Req() req: any,
  ) {
    const rawUserId = req.user?.userId || req.user?.sub || req.user?.id;
    const userId = Number(rawUserId);
    return this.projetosService.createTask(id, body, Number.isFinite(userId) ? userId : undefined);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/tarefas/:taskId')
  async updateTask(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() body: UpdateProjetoTarefaDto,
  ) {
    return this.projetosService.updateTask(id, taskId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/tarefas/:taskId')
  async deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.projetosService.deleteTask(id, taskId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projetosService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.projetosService.remove(id);
  }
}
