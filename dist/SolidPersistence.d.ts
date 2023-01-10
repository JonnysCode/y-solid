import { Observable } from 'lib0/observable';
import * as Y from 'yjs';
import { Session } from '@inrupt/solid-client-authn-browser';
import { SolidDataset, WebRtcConnection } from './SolidDataset';
import { AccessModes } from './SolidAccess';
export interface Collaborator {
    webId: string;
    isCreator: boolean;
}
/**
 * Class for handling communication between the yjs doc and the corresponding
 * dataset on a Solid POD.
 *
 * @extends {Observable<string>}
 */
export declare class SolidPersistence extends Observable<string> {
    /**
     * The name of the dataset.
     * @type {string}
     */
    name: string;
    /**
     * The Y.Doc instance.
     * @type {Y.Doc}
     */
    doc: Y.Doc;
    /**
     * Whether the user is logged in.
     * @type {boolean}
     */
    loggedIn: boolean;
    /**
     * The SolidAuthClient session.
     * @type {Session}
     */
    session: Session;
    /**
     * The SolidDataset instance.
     * @type {SolidDataset|null}
     */
    dataset: SolidDataset | null;
    /**
     * The WebSocket connection.
     * @type {any}
     */
    websocket: any;
    /**
     * The update interval to the Solid Pod.
     * @type {number}
     */
    updateInterval: number;
    private isUpdating;
    private updates;
    private requiresFetch;
    private isFetching;
    private constructor();
    static create(name: string, doc: Y.Doc, autoLogin: boolean, resourceUrl: string | undefined, socketUrl?: string, updateInterval?: number): Promise<SolidPersistence>;
    /**
     * Applies updates to the local Yjs document and syncs them to the POD.
     * @param {any[]} updates - Array of updates to apply
     * @returns {Promise<void>}
     * @throws {Error} If the user is not logged in
     */
    update(updates: Uint8Array[]): Promise<void>;
    /**
     * Fetches the latest state of the dataset from the POD.
     * @returns {Promise<void>}
     * @throws {Error} If the user is not logged in
     */
    fetch(): Promise<void>;
    getWebRtcConnection(): WebRtcConnection;
    getCollaborators(): Collaborator[];
    addAgentAccess(webId: string, access?: AccessModes): Promise<void>;
    addPublicAccess(access?: AccessModes): Promise<void>;
    addWriteAccess(webId: string): Promise<void>;
    addReadAccess(webId: string): Promise<void>;
}
