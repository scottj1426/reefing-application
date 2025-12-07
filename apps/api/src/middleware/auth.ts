import { expressjwt as jwt, type GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const AUTH0_ISSUER = process.env.AUTH0_ISSUER;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE || !AUTH0_ISSUER) {
  console.error('Missing Auth0 environment variables:');
  console.error('AUTH0_DOMAIN:', AUTH0_DOMAIN);
  console.error('AUTH0_AUDIENCE:', AUTH0_AUDIENCE);
  console.error('AUTH0_ISSUER:', AUTH0_ISSUER);
  throw new Error('Missing Auth0 environment variables');
}

export const authMiddleware: (req: Request, res: Response, next: NextFunction) => void = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  }) as GetVerificationKey,
  audience: AUTH0_AUDIENCE,
  issuer: AUTH0_ISSUER,
  algorithms: ['RS256'],
});
