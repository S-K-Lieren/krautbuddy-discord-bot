import { Message } from 'discord.js';
import { AbstractModule, Commands, Module } from '..';
import { initHttpApi } from '../../../http-api/http-api';
import { DiscordID } from '../../types';
import { EmbedInfo, Util } from '../../util';

require('dotenv').config();
@Module({
    name: 'http',
    alwaysActivated: true
})
export class HttpApiModule extends AbstractModule {

    // private expressApp!: express.Express;

    init(): void {
        // this.expressApp = 
        initHttpApi(
            4250,
            (message: string) => this.sendMessageFn(message),
            (message: string, embed: {
                info?: EmbedInfo
            }) => this.sendEmbed(message, embed)
        );
    }

    protected registerCommands(): Commands {
        return {
            'now': {
                handler: (msg: Message) => this.now(msg)
            }
        };
    }


    private now(msg: Message): void {
        (msg as any).reply({ content: `<t:${Math.floor(Date.now() / 1000)}:T>` });
    }

    private sendEmbed(
        msg: string,
        embed: {
            info?: EmbedInfo
        }): Promise<DiscordID | undefined> {

        return Util.sendEmbedMessage(
            process.env.EVENTS_CHANNEL_ID as string,
            msg,
            embed,
            this.client
        )
    }

    private sendMessageFn(message: string): Promise<void> {

        if (process.env.ENVIRONMENT === 'development') {
            message = `[dev] ${message}`;
        }
        return Util.sendMessageToChannel(
            this.client,
            process.env.EVENTS_CHANNEL_ID as string,
            message
        );
    }

}
