import { Observable } from 'lib0/observable';
import * as Y from 'yjs';
import { Session } from '@inrupt/solid-client-authn-browser';
import { AgentAccess } from '@inrupt/solid-client';
import { SolidDataset, WebRtcConnection } from './SolidDataset';
export interface AccessModes {
    read: boolean;
    append: boolean;
    write: boolean;
    controlRead: boolean;
    controlWrite: boolean;
}
export declare const login: (oidcIssuer?: string, redirectUrl?: string, clientName?: string) => Promise<Session>;
export declare const getAccessInfoWAC: (datasetWithAcl: any) => Promise<AgentAccess | null>;
export declare const getPublicAccessInfo: (datasetUrl?: string) => Promise<void>;
export declare const getAgentAccessInfo: (resourceUrl: string, webid: string) => Promise<AccessModes | null>;
export declare const setPublicAccess: (resourceUrl: string, access: AccessModes) => Promise<AccessModes | null>;
export declare const setAgentAccess: (resourceUrl: string, webId: string, access: AccessModes) => Promise<void>;
export interface Collaborator {
    webId: string;
    isCreator: boolean;
}
export declare class SolidPersistence extends Observable<string> {
    name: string;
    doc: Y.Doc;
    loggedIn: boolean;
    session: Session;
    dataset: SolidDataset | null;
    websocket: any;
    updateInterval: number;
    private isUpdating;
    private updates;
    private requiresFetch;
    private isFetching;
    private constructor();
    static create(name: string, doc: Y.Doc, autoLogin?: boolean, resourceUrl?: string, socketUrl?: string, updateInterval?: number): Promise<SolidPersistence>;
    update(updates: Uint8Array[]): Promise<void>;
    fetch(): Promise<void>;
    setAgentAccess(webId: string, access?: AccessModes): Promise<void>;
    setPublicAccess(access?: AccessModes): Promise<void>;
    getWebRtcConnection(): WebRtcConnection;
    getCollaborators(): Collaborator[];
    addWriteAccess(webId: string): Promise<void>;
    addReadAccess(webId: string): Promise<void>;
}
