import { AnyChannel, Channel, Client, ColorResolvable, Guild, Message, MessageEmbed, TextBasedChannel, TextChannel } from 'discord.js';
import { DiscordID } from '.';

export interface EmbedInfo {
    author: {
        name: string;
        iconURL: string;
    },
    img: string,
    thumbnail: string,
    url: string,
    color: ColorResolvable
};

export class Util {
    static async sendMessageToChannel(client: Client, channelID: string, msg: string, embed?: EmbedInfo): Promise<void> {
        const channel: AnyChannel | null = await Util.getChannelByID(client, channelID);

        if (channel && channel.isText()) {
            if (!embed) {
                channel.send(msg);

                return;
            }

            Util.sendEmbedMessage(channel, msg, { info: embed });

        }
    }

    static channelMentionToID(mention: string): string | undefined {
        const regex: RegExp = new RegExp(/<#(\d+)>/gm);

        if (!regex.test(mention)) {
            return undefined;
        }

        return mention.replace('<', '').replace('>', '').replace('#', '');
    }

    static isValidChannel(guild: Guild, channelID: string, onlyText?: boolean): boolean {
        if (!guild?.channels.cache.has(channelID)) {
            return false;
        }

        if (onlyText && !guild.channels.cache.get(channelID)?.isText) {
            return false;
        }

        return true;
    }

    static async sendEmbedMessage(channel: TextBasedChannel | TextChannel | Channel | string | null, msg: string, embed: { info?: EmbedInfo, embed?: MessageEmbed }, client?: Client, pingText?: string): Promise<DiscordID | undefined> {

        if (!channel) {
            return;
        }

        if (typeof channel === 'string') {
            if (!client) {
                return;
            }
            channel = await Util.getChannelByID(client, channel);
        }

        if (!channel || !channel.isText()) {
            return;
        }

        let e: MessageEmbed;

        if (embed.info) {
            e = new MessageEmbed()
                .setDescription(msg)
                .setThumbnail(embed.info.author.iconURL)
                // .setThumbnail(`attachment://${thumbnailAttachment.id}`)
                .setImage(embed.info.img.replace('{width}', '1600').replace('{height}', '900'))
                // .setImage(`attachment://${imageAttachment.id}`)
                .setURL(embed.info.url)
                .setColor(embed.info.color);
        }
        else if (embed.embed) {
            e = embed.embed;
        }
        else {
            return;
        }

        if (embed.info?.author) {
            e.setAuthor(embed.info.author.name, embed.info.author.iconURL);
        }

        const embedMessage: Message<boolean> = await (channel as TextChannel).send({ content: pingText, embeds: [e] });
        if (embedMessage?.id) {
            return embedMessage.id;
        }
        return;

    }

    static wrapInBackTicks(text: string): string {
        return (text?.length) ? `\`\`\`${text}\`\`\`` : '';
    }

    static async getChannelByID(client: Client, channelID: string): Promise<AnyChannel | null> {
        return await client.channels.fetch(channelID);
    }
}
