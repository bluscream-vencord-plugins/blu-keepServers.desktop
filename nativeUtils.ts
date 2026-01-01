// Authors: Bluscream, Cursor.AI
// Created at 2025-10-06 05:20:57
/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function getNative() {
    if (IS_WEB) {
        return {
            loadServerData: async () => ({}),
            saveServerData: async () => { },
            deleteServerData: async () => { },
            init: async () => { },
            initDirs: async () => { },
            getDefaultNativeDataDir: async () => "",
            keepServersUniqueIdThingyIdkMan: async () => { },
        };
    }

    return Object.values(VencordNative.pluginHelpers)
        .find(m => m.keepServersUniqueIdThingyIdkMan) as any;
}
