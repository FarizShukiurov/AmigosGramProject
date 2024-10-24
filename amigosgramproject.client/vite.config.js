import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "amigosgramproject.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7015';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/pingauth': {
                target,
                secure: false
            },
            '^/register': {
                target,
                secure: false
            },
            '^/login': {
                target,
                secure: false
            },
            '^/logout': {
                target,
                secure: false
            },
            '^/Account/SendEmailConfirmation': {
                target,
                secure: false
            },
            '^/Account/ConfirmEmail': {
                target,
                secure: false
            },
            '^/Account/SearchAccount': {
                target,
                secure: false
            },
            '^/contacts/GetContacts': {
                target,
                secure: false
            },
            '^/contacts/AddContact': {
                target,
                secure: false
            },
            '^/contacts/DeleteContact': {
                target,
                secure: false
            },
            '^/api/Profile/upload-avatar': {
                target,
                secure: false
            },
            '^/api/Profile/get-user-data': {
                target,
                secure: false
            },
            '^/api/Profile/change-username': {
                target,
                secure: false
            },
            '^/Chat/GetChats': {
                target,
                secure: false
            },
            '^/Message/SendMessage': {
                target,
                secure: false
            },
            '^/api/Message/getLastMessageBetweenUsers': {
                target,
                secure: false
            },
            '^/api/Message/getMessagesBetweenUsers': {
                target,
                secure: false
            },
            '^/Account/GetCurrentUserId': {
                target,
                secure: false
            },
            '^/api/Message/createMessage': {
                target,
                secure: false
            }
            
        },
        port: 5173,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
})
