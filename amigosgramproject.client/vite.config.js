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

const target = env.ASPNETCORE_HTTPS_PORT
    ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
    : env.ASPNETCORE_URLS
        ? env.ASPNETCORE_URLS.split(';')[0]
        : 'https://localhost:7015';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        proxy: {
            '^/Account/ResetPasswordForm': {
                target,
                secure: false,
            },
            '^/Account/SendResetPasswordLink': {
                target,
                secure: false,
            },
            '^/Account/ResetPassword': {
                target,
                secure: false,
            },
            '^/Account/pingauth': {
                target,
                secure: false,
            },
            '^/Account/logout': {
                target,
                secure: false,
            },
            '^/Account/SendEmailConfirmation': {
                target,
                secure: false,
            },
            '^/Account/ConfirmEmail': {
                target,
                secure: false,
            },
            '^/Account/ResendEmailConfirmation': {
                target,
                secure: false,
            },
            '^/Account/SearchAccount': {
                target,
                secure: false,
            },
            '^/api/Contacts/GetContacts': {
                target,
                secure: false,
            },
            '^/api/Contacts/AddContact': {
                target,
                secure: false,
            },
            '^/api/Contacts/DeleteContact': {
                target,
                secure: false,
            },
            '^/api/Contacts/DeleteContactRequest': {
                target,
                secure: false,
            },
            '^/api/Profile/upload-avatar': {
                target,
                secure: false,
            },
            '^/api/Profile/get-user-data': {
                target,
                secure: false,
            },
            '^/api/Profile/change-username': {
                target,
                secure: false,
            },
            '^/api/Profile/set-avatar-url': {
                target,
                secure: false,
            },
            '^/Chat/GetChats': {
                target,
                secure: false,
            },
            '^/Message/SendMessage': {
                target,
                secure: false,
            },
            '^/api/Message/getLastMessageBetweenUsers': {
                target,
                secure: false,
            },
            '^/api/Message/getMessagesBetweenUsers': {
                target,
                secure: false,
            },
            '^/Account/GetCurrentUserId': {
                target,
                secure: false,
            },
            '^/api/Message/createMessage': {
                target,
                secure: false,
            },
            '^/api/Files/uploadAudio': {
                target,
                secure: false,
            },
            '^/api/files/upload': {
                target,
                secure: false,
            },
            '^/api/files/delete/': {
                target,
                secure: false,
            },
            '^/Account/register': {
                target,
                secure: false,
            },
            '^/Account/login': {
                target,
                secure: false,
            },
            '^/Account/refresh-token': {
                target,
                secure: false,
            },
            '^/api/Keys/storePublicKey': {
                target,
                secure: false,
            },
            '^/api/Keys/getPublicKey': {
                target,
                secure: false,
            },
            '^/api/Message/deleteMessageById': {
                target,
                secure: false,
            },
            '^/api/Message/editMessageById': {
                target,
                secure: false,
            },
            '^/api/Contacts/SendContactRequest': {
                target,
                secure: false,
            },
            '^/api/Contacts/RespondToContactRequest': {
                target,
                secure: false,
            },
            '^/api/Contacts/GetContactRequests': {
                target,
                secure: false,
            },
            '^/api/Contacts/GetContactDetails': {
                target,
                secure: false,
            },
        },
        port: 5173,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        },
    },
});
