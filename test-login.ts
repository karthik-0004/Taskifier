import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AuthService } from './src/auth/auth.service';
import { PasswordService } from './src/auth/password.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from './src/email/email.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

const passwordService = new PasswordService();
const jwtService = new JwtService({ secret: 'test' });
const emailService = {} as EmailService; // Mock

const authService = new AuthService(prisma, passwordService, jwtService, emailService);

async function test() {
  const email = 'manager@taskifier.dev';
  const password = 'password123';
  const user = await prisma.user.findFirst({ where: { email } });
  
  console.log('--- TEST 1: Valid credentials and valid Connection Key ---');
  try {
    const res = await authService.extensionLogin(email, password, user.connectionKey);
    console.log('Success! Access Token:', res.accessToken ? 'Generated' : 'Failed');
    console.log('Returned Employee:', res.employee.name);
  } catch (err: any) {
    console.log('Error:', err.message);
  }

  console.log('\n--- TEST 2: Valid credentials but WRONG Connection Key ---');
  try {
    await authService.extensionLogin(email, password, 'TKF-INVALID');
    console.log('Failed! Should have thrown error.');
  } catch (err: any) {
    console.log('Success - Rejected with error:', err.message);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
