import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async verifyGoogleIdToken(idToken: string) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();

            if (!payload) throw new UnauthorizedException('Invalid Google token');

            // ✅ Important checks
            if (!payload.email) throw new UnauthorizedException('Google email missing');
            if (!payload.email_verified)
                throw new UnauthorizedException('Google email not verified');

            return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
            };
        } catch (err) {
            console.error('Google token verification error:', err);
            throw new UnauthorizedException('Google token verification failed');
        }
    }
}
