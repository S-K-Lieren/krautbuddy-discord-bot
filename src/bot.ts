import { Client, Message, MessageReaction, PartialMessageReaction } from 'discord.js';
import { AbstractModule, CoreModule, ModuleHub, Newable } from './core/module-system';
import { Util } from './core';
import { DatabaseAdapter } from './core/abstract-database-adapter';
import { SqlAdapter } from './database-adapters/sqlite.adapter';
import { HttpApiModule } from './core/module-system/http-api-module/http-api.module';

require('dotenv').config();

interface ClientOptions {
    token: string;
    url: string;
}

export class NeganBot {
    private client!: Client;
    private moduleHub!: ModuleHub;
    private options!: ClientOptions;
    private db: DatabaseAdapter;

    constructor() {
        this.init();
        this.db = new SqlAdapter();

        this.moduleHub = new ModuleHub(this.client, this.db);
    }

    public async registerModules(modules: Array<Newable<AbstractModule>>): Promise<void> {
        this.moduleHub
            .addModules<AbstractModule>(CoreModule, ...modules);
    }

    public getModule<T extends AbstractModule>(module: typeof AbstractModule): T | undefined {
        return this.moduleHub.getModules()
            .find((m: AbstractModule) => m.metaData.name === module.prototype.metaData.name) as T | undefined;
    }

    private async init(): Promise<void> {

        this.options = {
            token: process.env.TOKEN ?? '',
            url: process.env.URL ?? ''
        };

        await this.createClient();
        await this.listenOnClientEvents();
    }

    private async createClient(): Promise<void> {
        this.client = new Client({
            intents: [
                'GUILDS',
                'GUILD_MESSAGES',
                'GUILD_MESSAGE_REACTIONS',
                'GUILD_MESSAGE_TYPING',
                'GUILD_EMOJIS_AND_STICKERS'
            ],
            partials: ['USER', 'REACTION', 'MESSAGE']
        });
    }

    private async listenOnClientEvents(): Promise<void> {
        this.client.on('ready', () => {

            this.moduleHub.ready();
            console.log(`Logged in as ${this.client.user?.tag}!`);
        });

        this.client.on('messageCreate', (msg: Message) => {
            if (msg.author.bot) return;

            this.moduleHub.handle(msg);
        });

        this.client.on('messageReactionAdd', (reaction: MessageReaction | PartialMessageReaction) => {
            this.moduleHub.handleReaction(reaction);
        });
        this.client.on('messageReactionRemove', (reaction: MessageReaction | PartialMessageReaction) => {
            this.moduleHub.handleReaction(reaction);
        });

        await this.client.login(this.options.token);

        this.client.user?.setActivity(this.options.url, {
            type: "WATCHING",
            url: this.options.url
        });

        if (process.env.ENVIRONMENT && process.env.ENVIRONMENT !== 'development' && process.env.DEBUG_CHANNEL_ID) {

            const currentVersion: string = process.env.npm_package_version ?? '';
            const packageName: string = process.env.npm_package_name ?? '';

            Util.sendMessageToChannel(
                this.client,
                process.env.DEBUG_CHANNEL_ID as string,
                `${packageName}@${currentVersion} online.`
            );
        }
    }
}

const bot: NeganBot = new NeganBot();
bot.registerModules([HttpApiModule]);

export * from './public-api';
