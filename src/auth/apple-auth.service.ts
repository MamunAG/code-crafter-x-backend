/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class AppleAuthService {
    private client = jwksClient({
        jwksUri: 'https://appleid.apple.com/auth/keys',
        cache: true,
        rateLimit: true,
    });

    private async getAppleSigningKey(kid: string): Promise<string> {
        const key = await this.client.getSigningKey(kid);
        return key.getPublicKey();
    }

    async verifyAppleIdToken(identityToken: string) {
        try {
            const decoded = jwt.decode(identityToken, { complete: true });

            if (!decoded || typeof decoded === 'string') {
                throw new UnauthorizedException('Invalid Apple token');
            }

            const kid = decoded.header.kid;
            if (!kid) throw new UnauthorizedException('Apple token missing kid');

            const publicKey = await this.getAppleSigningKey(kid);

            const payload = jwt.verify(identityToken, publicKey, {
                algorithms: ['RS256'],
                audience: process.env.APPLE_CLIENT_ID,
                issuer: 'https://appleid.apple.com',
            }) as jwt.JwtPayload;

            // ✅ Apple may not always send email after first login
            return {
                appleId: payload.sub,
                email: payload.email as string | undefined,
                email_verified: payload.email_verified,
                is_private_email: payload.is_private_email,
            };
        } catch (err) {
            console.log('Apple token verification error:', err);
            throw new UnauthorizedException('Apple token verification failed');
        }
    }
}
