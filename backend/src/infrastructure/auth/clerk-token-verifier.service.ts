import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkTokenVerifierService implements OnModuleInit {
  private readonly logger = new Logger(ClerkTokenVerifierService.name);
  private jwtKey?: string;
  private secretKey?: string;

  onModuleInit() {
    this.jwtKey = process.env.CLERK_JWT_KEY;
    this.secretKey = process.env.CLERK_SECRET_KEY;

    if (!this.jwtKey && !this.secretKey) {
      this.logger.warn(
        'Neither CLERK_JWT_KEY nor CLERK_SECRET_KEY is configured — authentication will fail at runtime',
      );
    } else if (this.jwtKey) {
      this.logger.log('JWT verification configured with jwtKey (networkless)');
    } else {
      this.logger.log(
        'JWT verification configured with secretKey (JWKS fallback)',
      );
    }
  }

  async verify(token: string): Promise<{ sub: string }> {
    const verifyOptions: { jwtKey?: string; secretKey?: string } = {};

    if (this.jwtKey) {
      verifyOptions.jwtKey = this.jwtKey;
    } else if (this.secretKey) {
      verifyOptions.secretKey = this.secretKey;
    } else {
      throw new Error('Authentication not configured');
    }

    const payload = await verifyToken(token, verifyOptions);
    return payload as { sub: string };
  }
}
