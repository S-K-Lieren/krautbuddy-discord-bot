import express, { Request, Response } from 'express';
import { DiscordID, EmbedInfo } from '../core';
import { MessageEmbed } from 'discord.js';

export function initHttpApi(
    port: number,
    sendDebugMessageFn: (message: string) => Promise<void>,
    sendEmbedFn: (message: string, embed: {
        info?: EmbedInfo
    }) => Promise<DiscordID | undefined>
): express.Express {
    const app: express.Express = express();

    // Add json bodyparser
    app.use(express.json());

    app.post('/message', (req: Request, res: Response) => {

        const msg: { message: string } = req.body;

        sendDebugMessageFn(msg.message);

        res.sendStatus(200);
    });

    app.post('/embed', (req: Request, res: Response) => {
        const msg: {
            message: string,
            embed: {
                info?: EmbedInfo,
                embed?: MessageEmbed
            }
        } = req.body;

        sendEmbedFn(msg.message, msg.embed);

        res.sendStatus(200);
    });

    app.listen(port, '127.0.0.1', () => {
        console.log(`krautbuddy discord bot listening on http://127.0.0.1:${port}`);
    });

    return app;
}


