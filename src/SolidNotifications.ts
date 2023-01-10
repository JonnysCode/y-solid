import * as logging from 'lib0/logging';

const log = logging.createModuleLogger('solid-notifications');

/**
 * Subscribe to a Solid resource via WebSocket.
 * Currently only supports NSS implementations of pods.
 *
 * @param resourceUrl
 * @param socketUrl
 * @returns A websocket connection to the resource
 */
export const openSolidWebSocket = (
  resourceUrl: string,
  socketUrl = 'wss://inrupt.net/',
): WebSocket | null => {
  try {
    const websocket = new WebSocket(socketUrl, ['solid-0.1']);

    websocket.onopen = function () {
      this.send('sub ' + resourceUrl);
    };

    return websocket;
  } catch (e) {
    log(logging.RED, 'Could not connect to websocket:', e);
  }

  return null;
};
