import {
  Controller,
  Get,
  Delete,
  Req,
  Res,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GithubOauthService } from './github-oauth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('github')
export class GithubOauthController {
  constructor(private readonly githubOauthService: GithubOauthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('connect')
  connect(@Req() req: any, @Res() res: Response) {
    const url = this.githubOauthService.getAuthorizeUrl(req.user.id);
    return res.redirect(url);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    await this.githubOauthService.handleCallback(code, state);
    return { message: 'GitHub account connected successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  status(@Req() req: any) {
    return this.githubOauthService.getStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  disconnect(@Req() req: any) {
    return this.githubOauthService.disconnect(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('commits')
  commits(
    @Req() req: any,
    @Query('repo') repo?: string,
  ) {
    return this.githubOauthService.getRecentCommits(req.user.id, repo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pull-requests')
  pullRequests(@Req() req: any) {
    return this.githubOauthService.getRecentPullRequests(req.user.id);
  }
}
