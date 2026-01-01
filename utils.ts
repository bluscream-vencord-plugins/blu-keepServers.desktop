/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "@webpack";
import { ChannelStore, GuildChannelStore, GuildStore, InviteActions, MessageStore } from "@webpack/common";

import { Logger } from "@utils/Logger";

import { getNative } from "./nativeUtils";

const logger = new Logger("KeepServers-Utils", "#7289da");

const InviteModalActions = findByPropsLazy("openInviteModal");
const GuildActions = findByPropsLazy("createGuildInvite");

export interface ServerData {
    id: string;
    name: string;
    icon?: string;
    inviteCode?: string;  // Just the invite code, not the full URL
    joinedAt: string;
    removedAt?: string;
}

// Create a fake guild entry in the guild list
export function createFakeGuildEntry(serverData: ServerData) {
    logger.info(`Creating fake guild entry for ${serverData.name}`);

    // The fake guild entry is now handled by the getFakeGuilds method in the main plugin
    // and the patches that modify the guild list rendering
}

// Remove fake guild entry from guild list
export function removeFakeGuildEntry(serverId: string) {
    logger.info(`Removing fake guild entry for ${serverId}`);

    // TODO: Implement actual fake guild entry removal
    // This would involve removing the fake guild from the guild store
}

// Save server data to storage
export async function saveServerData(serverData: ServerData) {
    try {
        const native = getNative();
        const data = await native.loadServerData();
        data[serverData.id] = serverData;
        await native.saveServerData(data);
        logger.info(`Saved server data for ${serverData.name}`);
    } catch (error) {
        logger.error("Failed to save server data:", error);
    }
}

// Get or create an invite code for a server
export async function getServerInviteCode(guildId: string): Promise<string | null> {
    try {
        const guild = GuildStore.getGuild(guildId);
        if (!guild) return null;

        // First, try to create a permanent invite
        try {
            const invite = await GuildActions.createGuildInvite(guildId, {
                max_age: 0, // Never expires
                max_uses: 0, // Unlimited uses
                temporary: false
            });

            if (invite && invite.code) {
                return invite.code; // Return just the code
            }
        } catch (error) {
            logger.warn(`Failed to create invite for ${guild.name}:`, error);
        }

        // If creating invite failed, search for existing invites in messages
        const channels = GuildChannelStore.getChannels(guildId);
        const textChannels = Object.values(channels).filter((channel: any) =>
            channel.type === 0 // GUILD_TEXT
        );

        // Search in the first few text channels for invite links
        for (const channel of textChannels.slice(0, 5)) {
            try {
                const messages = MessageStore.getMessages((channel as any).id);
                if (!messages || !messages.messageIds) continue;

                const messageIds = Array.from(messages.messageIds).slice(-50); // Last 50 messages

                for (const messageId of messageIds) {
                    const message = MessageStore.getMessage((channel as any).id, messageId as string);
                    if (!message || !message.content) continue;

                    // Look for discord.gg/ or discord.com/invite/ links
                    const inviteMatch = message.content.match(/discord\.(?:gg|com\/invite)\/([a-zA-Z0-9]+)/);
                    if (inviteMatch) {
                        logger.info(`Found invite code in messages: ${inviteMatch[1]}`);
                        return inviteMatch[1]; // Return just the code
                    }
                }
            } catch (error) {
                logger.warn(`Failed to search messages in channel ${(channel as any).name}:`, error);
            }
        }

        return null;
    } catch (error) {
        logger.error(`Failed to get invite link for guild ${guildId}:`, error);
        return null;
    }
}

// Get full invite link from invite code
export function getInviteLink(inviteCode: string): string {
    return `discord.gg/${inviteCode}`;
}

// Join a server using an invite code
export async function joinServer(inviteCode: string): Promise<boolean> {
    try {
        await InviteActions.acceptInvite(inviteCode, "KeepServers");
        logger.info(`Attempted to join server with invite code: ${inviteCode}`);
        return true;
    } catch (error) {
        logger.error(`Failed to join server with invite code ${inviteCode}:`, error);
        return false;
    }
}

// Delete server data from storage
export async function deleteServerData(serverId: string) {
    try {
        const native = getNative();
        await native.deleteServerData(serverId);
        logger.info(`Deleted server data for ${serverId}`);
    } catch (error) {
        logger.error("Failed to delete server data:", error);
    }
}
