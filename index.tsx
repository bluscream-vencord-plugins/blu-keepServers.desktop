/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, GuildStore, InviteActions, NavigationRouter, React } from "@webpack/common";

import { openServerInfoModal } from "./components/ServerInfoModal.js";
import { createFakeGuildEntry, getServerInviteCode, removeFakeGuildEntry, saveServerData } from "./utils.js";
import { getNative } from "./nativeUtils.js";

export const cl = classNameFactory("blu-keep-servers-");

export const logger = new Logger("KeepServers", "#7289da");

const settings = definePluginSettings({
    showInGuildList: {
        type: OptionType.BOOLEAN,
        description: "Show removed servers in guild list",
        default: true
    },
    autoCreateInvites: {
        type: OptionType.BOOLEAN,
        description: "Automatically create invite links when joining servers",
        default: true
    },
    searchForInvites: {
        type: OptionType.BOOLEAN,
        description: "Search for existing invite links in server messages",
        default: true
    }
});

interface ServerData {
    id: string;
    name: string;
    icon?: string;
    inviteCode?: string;
    joinedAt: string;
    removedAt?: string;
}

const storedServers = new Map<string, ServerData>();

// Load stored servers on plugin start
async function loadStoredServers() {
    try {
        const native = getNative();
        const data = await native.loadServerData();
        Object.entries(data).forEach(([id, serverData]) => {
            storedServers.set(id, serverData as ServerData);
        });
        logger.info(`Loaded ${storedServers.size} stored servers`);
    } catch (error) {
        logger.error("Failed to load stored servers:", error);
    }
}

// Save servers to external storage
async function saveStoredServers() {
    try {
        const native = getNative();
        const data = Object.fromEntries(storedServers);
        await native.saveServerData(data);
        logger.info(`Saved ${storedServers.size} servers to storage`);
    } catch (error) {
        logger.error("Failed to save stored servers:", error);
    }
}

async function onGuildCreate(guild: any) {
    if (!settings.store.autoCreateInvites) return;

    logger.info(`Joined server: ${guild.name} (${guild.id})`);

    const serverData: ServerData = {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        joinedAt: new Date().toISOString()
    };

    try {
        // Try to create or find an invite code
        const inviteCode = await getServerInviteCode(guild.id);
        if (inviteCode) {
            serverData.inviteCode = inviteCode;
            logger.info(`Found invite code for ${guild.name}: ${inviteCode}`);
        }
    } catch (error) {
        logger.warn(`Failed to get invite code for ${guild.name}:`, error);
    }

    storedServers.set(guild.id, serverData);
    saveStoredServers();
}

async function onGuildDelete(event: any) {

    const { guild } = event;
    if (guild.unavailable) return; // Server is temporarily unavailable, not removed

    logger.info(`Left/removed from server: ${guild.id}`);

    const serverData = storedServers.get(guild.id);
    if (!serverData) return;

    // Mark as removed and update storage
    serverData.removedAt = new Date().toISOString();
    storedServers.set(guild.id, serverData);
    saveStoredServers();

    // Add fake guild entry to guild list if enabled
    if (settings.store.showInGuildList) {
        createFakeGuildEntry(serverData);
    }
}

export default definePlugin({
    name: "KeepServers (Native)",
    description: "Keeps track of servers you've joined and allows you to rejoin them later",
    authors: [
        { name: "Bluscream", id: 467777925790564352n },
        { name: "Cursor.AI", id: 0n },
    ],
    settings,

    patches: [
        {
            find: "getGuildsTree:",
            replacement: {
                match: /getGuildsTree:\(\)=>\{/,
                replace: "getGuildsTree:()=>{const fakeGuilds=$self.getFakeGuilds();"
            }
        },
        {
            find: ".getGuildsTree(),",
            replacement: {
                match: /\.getGuildsTree\(\),/,
                replace: ".getGuildsTree().concat($self.getFakeGuilds()),"
            }
        },
        {
            find: "onClick:",
            replacement: {
                match: /onClick:(\i),/,
                replace: "onClick:$self.handleGuildClick($1),"
            }
        }
    ],

    flux: {
        GUILD_CREATE: onGuildCreate,
        GUILD_DELETE: onGuildDelete
    },

    getFakeGuilds() {
        if (!settings.store.showInGuildList) return [];

        const fakeGuilds: any[] = [];
        for (const [id, serverData] of storedServers) {
            if (serverData.removedAt) {
                fakeGuilds.push({
                    id: `fake-${id}`,
                    name: serverData.name,
                    icon: serverData.icon || null,
                    fake: true,
                    originalId: id,
                    serverData
                });
            }
        }
        return fakeGuilds;
    },

    handleGuildClick(originalOnClick: (guildId: string) => void) {
        return (guildId: string) => {
            // Check if this is a fake guild
            if (guildId.startsWith('fake-')) {
                const originalId = guildId.replace('fake-', '');
                const serverData = storedServers.get(originalId);
                if (serverData) {
                    openServerInfoModal(serverData);
                    return;
                }
            }

            // Call the original onClick handler for real guilds
            originalOnClick(guildId);
        };
    },

    async start() {
        loadStoredServers();
        logger.info("KeepServers plugin started");
    },

    stop() {
        logger.info("KeepServers plugin stopped");
    }
});
