import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GithubOauthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  getAuthorizeUrl(userId: string): string {
    const state = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '5m' },
    );

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: process.env.GITHUB_CALLBACK_URL!,
      scope: 'read:user repo',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, state: string) {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(state);
    } catch {
      throw new UnauthorizedException('Invalid or expired state parameter');
    }

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
      },
    );

    const tokenData: any = await tokenResponse.json();

    if (tokenData.error) {
      throw new UnauthorizedException(
        `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`,
      );
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData: any = await userResponse.json();

    await this.prisma.githubConnection.upsert({
      where: { userId: payload.sub },
      update: {
        accessToken: tokenData.access_token,
        githubUsername: userData.login,
        connectedAt: new Date(),
      },
      create: {
        userId: payload.sub,
        accessToken: tokenData.access_token,
        githubUsername: userData.login,
      },
    });
  }

  async getStatus(userId: string) {
    const connection = await this.prisma.githubConnection.findUnique({
      where: { userId },
      select: { githubUsername: true, connectedAt: true },
    });

    return {
      connected: !!connection,
      githubUsername: connection?.githubUsername ?? null,
      connectedAt: connection?.connectedAt ?? null,
    };
  }

  async disconnect(userId: string) {
    const connection = await this.prisma.githubConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new NotFoundException('No GitHub connection found');
    }

    await this.prisma.githubConnection.delete({ where: { userId } });
  }

  async getRecentCommits(userId: string, repo?: string) {
    const connection = await this.getConnectionOrThrow(userId);

    if (repo) {
      const data = await this.fetchWithTokenCheck(
        connection,
        `https://api.github.com/repos/${repo}/commits?author=${connection.githubUsername}&per_page=30`,
      );
      return data.map((c: any) => this.mapCommit(c, repo));
    }

    const repos: any[] = await this.fetchWithTokenCheck(
      connection,
      'https://api.github.com/user/repos?sort=pushed&per_page=5&type=all',
    );

    const allCommits: any[] = [];
    for (const r of repos) {
      const commits: any[] = await this.fetchWithTokenCheck(
        connection,
        `https://api.github.com/repos/${r.full_name}/commits?author=${connection.githubUsername}&per_page=5`,
      );
      for (const c of commits) {
        allCommits.push(this.mapCommit(c, r.full_name));
      }
    }

    allCommits.sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );

    return allCommits.slice(0, 30);
  }

  async getRecentPullRequests(userId: string) {
    const connection = await this.getConnectionOrThrow(userId);

    const data: any = await this.fetchWithTokenCheck(
      connection,
      `https://api.github.com/search/issues?q=author:${connection.githubUsername}+type:pr&sort=created&order=desc&per_page=30`,
    );

    return (data.items ?? []).map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      repo: pr.repository_url?.split('/').slice(-2).join('/'),
      url: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    }));
  }

  private async getConnectionOrThrow(userId: string) {
    const connection = await this.prisma.githubConnection.findUnique({
      where: { userId },
    });
    if (!connection) {
      throw new NotFoundException(
        'No GitHub connection found. Connect your GitHub account via GET /github/connect first.',
      );
    }
    return connection;
  }

  private async fetchWithTokenCheck(connection: any, url: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 401) {
      await this.prisma.githubConnection.delete({
        where: { userId: connection.userId },
      });
      throw new UnauthorizedException(
        'Your GitHub access token is invalid or expired. Please reconnect your GitHub account via GET /github/connect.',
      );
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API error: ${response.status} ${errBody.message || response.statusText}`,
      );
    }

    return response.json();
  }

  private mapCommit(c: any, repoName: string) {
    return {
      sha: c.sha,
      message: c.commit.message,
      repo: repoName,
      url: c.html_url,
      date: c.commit.author?.date ?? null,
    };
  }
}
