# Blu Keep Servers Plugin

A Vencord plugin that keeps track of servers you've joined and allows you to rejoin them later, even after being kicked or leaving.

## Features

-   **Automatic Server Tracking**: Monitors when you join new servers and stores their information
-   **Invite Link Detection**: Automatically finds or creates invite links for servers
-   **Fake Server Entries**: Shows removed servers in the guild list with visual indicators
-   **Server Info Modal**: Click on fake server entries to view cached information and rejoin
-   **Persistent Storage**: Server data is saved across Discord sessions

## Installation

1. Copy the `blu-keepServers.desktop` folder to your Vencord `src/userplugins_` directory
2. Rebuild Vencord: `pnpm run build`
3. Restart Discord
4. Enable the plugin in Vencord settings
5. Configure your preferences

## How It Works

### When You Join a Server (GUILD_CREATE)

1. The plugin detects the new server
2. Attempts to create a permanent invite link
3. If that fails, searches recent messages for existing invite links
4. Stores server information (name, icon, invite link, join date) in localStorage

### When You Leave/Get Kicked (GUILD_DELETE)

1. The plugin detects the server removal
2. Marks the server as removed in storage
3. Creates a fake guild entry in the server list (if enabled)
4. The fake entry shows with a visual indicator (🚫 icon)

### Rejoining a Server

1. Click on a fake server entry in the guild list
2. A modal opens showing server information and available actions
3. Click "Join Server" to rejoin using the cached invite link
4. Click "Delete from Storage" to remove the server from the list

## Settings

-   **Enable Keep Servers**: Toggle the entire plugin on/off
-   **Show in Guild List**: Display removed servers as fake entries in the server list
-   **Auto Create Invites**: Automatically create invite links when joining servers
-   **Search for Invites**: Search server messages for existing invite links

## Technical Details

### Storage

Server data is stored in an external directory similar to MessageLoggerData. The data is saved to:

-   **Location**: `{EquicordData}/KeepServersData/servers.json`
-   **Settings**: `{EquicordData}/KeepServersData/ksSettings.json`

The data structure includes:

```typescript
interface ServerData {
    id: string; // Server ID
    name: string; // Server name
    icon?: string; // Server icon URL
    inviteLink?: string; // Cached invite link
    joinedAt: string; // ISO timestamp when joined
    removedAt?: string; // ISO timestamp when removed (if applicable)
}
```

### Guild List Integration

The plugin patches the Discord guild list to:

-   Inject fake guild entries for removed servers
-   Handle clicks on fake entries to open the server info modal
-   Add visual indicators to distinguish fake entries

### Invite Link Detection

The plugin uses multiple methods to find invite links:

1. **Create Permanent Invite**: Attempts to create a permanent invite with unlimited uses
2. **Search Messages**: Scans recent messages in text channels for discord.gg/ or discord.com/invite/ links
3. **Fallback**: If no invite is found, the server is still cached but may not be rejoinable

## Limitations

-   Requires appropriate permissions to create invite links
-   Some servers may not allow permanent invites
-   Invite links may expire or become invalid
-   The plugin cannot rejoin servers that have no available invite links

## Development

The plugin is structured as follows:

-   `index.tsx`: Main plugin file with flux event handlers and patches
-   `utils.ts`: Utility functions for invite detection and storage management
-   `components/ServerInfoModal.tsx`: Modal component for displaying server information
-   `native/`: Native module for external file system operations
    -   `index.ts`: Main native functions for data loading/saving
    -   `settings.ts`: Settings management for data directory
    -   `utils.ts`: Utility functions for directory operations
-   `styles.css`: CSS styles for the plugin UI

## AI Disclaimer

This plugin was developed with assistance from **Cursor.AI** (Cursor's AI coding assistant). The AI was used to help with code generation, debugging, documentation, and implementation. While AI assistance was utilized, all code and features were reviewed and tested to ensure quality and functionality.

## License

This plugin follows the same GPL-3.0-or-later license as Vencord.
