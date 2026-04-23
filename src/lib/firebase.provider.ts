import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';

export const FirebaseProvider: Provider = {
    provide: 'FIREBASE_ADMIN',
    useFactory: () => {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Missing Firebase environment variables');
        }
        // privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
        privateKey = privateKey
            .replace(/^["']|["']$/g, '')
            .replace(/\\\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\\r?\n/g, '\n')
            .replace(/\r/g, '')
            .trim();

        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
            throw new Error('Firebase private key does not start correctly');
        }

        if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
            throw new Error('Firebase private key does not end correctly');
        }

        // console.log(privateKey)

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        }

        return admin;
    },
};
