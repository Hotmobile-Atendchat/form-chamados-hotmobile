import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password || body.senha);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('verify-account')
  async verifyAccount(@Query('token') token: string) {
    return this.authService.verifyAccount(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateProfile(@Req() req: express.Request, @Body() body: any) {
    const user = (req as any).user;

    const dados = {
      nome: body.nome,
      email: body.email,
      cor: body.cor,
      senha: body.password,
    };

    const userId = user.userId || user.sub || user.id;

    return this.authService.updateProfile(userId, dados);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  async listUsers() {
    return this.authService.findAllForDropdown();
  }
}
