/**
 * Subscribe to a Solid resource via WebSocket.
 * Currently only supports NSS implementations of pods.
 *
 * @param resourceUrl
 * @param socketUrl
 * @returns A websocket connection to the resource
 */
export declare const openSolidWebSocket: (resourceUrl: string, socketUrl?: string) => WebSocket | null;
