/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Logger } from "@utils/Logger";
import { Button } from "@webpack/common";
import { React } from "@webpack/common";

import { deleteServerData, joinServer, getInviteLink, ServerData } from "../utils";

const cl = classNameFactory("blu-keep-servers-");
const logger = new Logger("KeepServers-Modal", "#7289da");

interface ServerInfoModalProps extends ModalProps {
    serverData: ServerData;
    onDelete: () => void;
}

export function ServerInfoModal({ serverData, onClose, onDelete, transitionState }: ServerInfoModalProps) {
    const handleJoinServer = async () => {
        if (!serverData.inviteCode) {
            logger.warn("No invite code available for server:", serverData.name);
            return;
        }

        const success = await joinServer(serverData.inviteCode);
        if (success) {
            onClose();
        }
    };

    const handleDeleteServer = async () => {
        await deleteServerData(serverData.id);
        onDelete();
        onClose();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <ModalRoot size={ModalSize.MEDIUM} transitionState={transitionState}>
            <ModalHeader>
                <div className={cl("modal-header")}>
                    {serverData.icon && (
                        <img
                            src={serverData.icon}
                            alt={serverData.name}
                            className={cl("server-icon")}
                        />
                    )}
                    <h2 className={cl("server-name")}>{serverData.name}</h2>
                </div>
            </ModalHeader>

            <ModalContent>
                <div className={cl("server-info")}>
                    <div className={cl("info-section")}>
                        <h3>Server Information</h3>
                        <div className={cl("info-item")}>
                            <strong>Server ID:</strong> {serverData.id}
                        </div>
                        <div className={cl("info-item")}>
                            <strong>Joined:</strong> {formatDate(serverData.joinedAt)}
                        </div>
                        {serverData.removedAt && (
                            <div className={cl("info-item")}>
                                <strong>Removed:</strong> {formatDate(serverData.removedAt)}
                            </div>
                        )}
                        {serverData.inviteCode && (
                            <div className={cl("info-item")}>
                                <strong>Invite Link:</strong>
                                <code className={cl("invite-link")}>{getInviteLink(serverData.inviteCode)}</code>
                            </div>
                        )}
                    </div>

                    {!serverData.inviteCode && (
                        <div className={cl("warning-section")}>
                            <p className={cl("warning-text")}>
                                No invite code is available for this server. You may not be able to rejoin.
                            </p>
                        </div>
                    )}
                </div>
            </ModalContent>

            <ModalFooter>
                <div className={cl("modal-actions")}>
                    <Button
                        color={Button.Colors.RED}
                        look={Button.Looks.OUTLINED}
                        onClick={handleDeleteServer}
                    >
                        Delete from Storage
                    </Button>

                    {serverData.inviteCode && (
                        <Button
                            color={Button.Colors.BRAND}
                            look={Button.Looks.FILLED}
                            onClick={handleJoinServer}
                        >
                            Join Server
                        </Button>
                    )}

                    <Button
                        color={Button.Colors.PRIMARY}
                        look={Button.Looks.OUTLINED}
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}

export function openServerInfoModal(serverData: ServerData) {
    const modalKey = `blu-keepServers-modal-${serverData.id}`;

    logger.info(`Opening server info modal for ${serverData.name}`);

    openModal((props) => (
        <ServerInfoModal
            {...props}
            serverData={serverData}
            onDelete={async () => {
                // Remove from stored servers
                await deleteServerData(serverData.id);
            }}
        />
    ), { modalKey });
}
