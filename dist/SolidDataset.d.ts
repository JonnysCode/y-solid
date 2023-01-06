export interface WebRtcConnection {
    room: string;
    password: string | null;
}
export declare const randomWebRtcConnection: () => WebRtcConnection;
export declare class SolidDataset {
    name: string;
    url: string;
    resource: any;
    thing: any;
    value: Uint8Array;
    creator: string | null;
    contributors: string[];
    private constructor();
    static create(name: string, url: string, webId: string): Promise<SolidDataset>;
    fetch: () => Promise<void>;
    update: (value: Uint8Array) => Promise<void>;
    /** Fetching and updating must be done in sync
     *
     * @param applyFetch
     * @param applyUpdate
     * @param getValue
     */
    fetchAndUpdate: (applyFetch: (value: Uint8Array) => void, applyUpdate: () => void, getValue: () => Uint8Array, maxTries?: number) => Promise<void>;
    save: () => Promise<void>;
    addWebRtcConnection: (connection?: WebRtcConnection) => Promise<WebRtcConnection>;
    getWebRtcConnection: () => WebRtcConnection | null;
}
