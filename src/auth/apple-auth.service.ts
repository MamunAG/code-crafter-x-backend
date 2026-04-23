/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AppleAuthService {
    private readonly appleJwksUrl = new URL('https://appleid.apple.com/auth/keys');
    private readonly josePromise = import('jose');

    async verifyAppleIdToken(identityToken: string) {
        try {
            const decoded = jwt.decode(identityToken, { complete: true });

            if (!decoded || typeof decoded === 'string') {
                throw new UnauthorizedException('Invalid Apple token');
            }

            const kid = decoded.header.kid;
            if (!kid) throw new UnauthorizedException('Apple token missing kid');

            const { createRemoteJWKSet, jwtVerify } = await this.josePromise;
            const appleKeySet = createRemoteJWKSet(this.appleJwksUrl);
            const { payload } = await jwtVerify(identityToken, appleKeySet, {
                algorithms: ['RS256'],
                audience: process.env.APPLE_CLIENT_ID,
                issuer: 'https://appleid.apple.com',
            });

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
