// Authors: Bluscream, Cursor.AI
// Created at 2025-10-06 05:09:50
/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DATA_DIR } from "@main/utils/constants";
import { IpcMainInvokeEvent } from "electron";

import { ServerData } from "./utils";

// so we can filter the native helpers by this key
export function keepServersUniqueIdThingyIdkMan() { }


let serversDataDir: string;

const getServersDataDir = async () => serversDataDir ?? await getDefaultNativeDataDir();

export async function initDirs() {
    serversDataDir = await getDefaultNativeDataDir();
    await ensureDirectoryExists(serversDataDir);
}

export async function init(_event: IpcMainInvokeEvent) {
    await initDirs();
}

export async function getDefaultNativeDataDir(): Promise<string> {
    return path.join(DATA_DIR, "KeepServersData");
}

export async function loadServerData(): Promise<Record<string, ServerData>> {
    try {
        const dataFile = path.join(await getServersDataDir(), "servers.json");
        const data = await readFile(dataFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        // Return empty object if file doesn't exist or can't be read
        return {};
    }
}

export async function saveServerData(data: Record<string, ServerData>): Promise<void> {
    const dataFile = path.join(await getServersDataDir(), "servers.json");
    await writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}

export async function deleteServerData(serverId: string): Promise<void> {
    const data = await loadServerData();
    delete data[serverId];
    await saveServerData(data);
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
        const { mkdir } = await import("fs/promises");
        await mkdir(dirPath, { recursive: true });
    } catch (error) {
        // Directory might already exist, ignore error
    }
}
