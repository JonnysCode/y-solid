import { Observable } from 'lib0/observable';
import * as Y from 'yjs';

import {
  handleIncomingRedirect,
  fetch,
  getDefaultSession,
  Session,
} from '@inrupt/solid-client-authn-browser';
import {
  universalAccess,
  getAgentAccessAll,
  AgentAccess,
} from '@inrupt/solid-client';
import {
  randomWebRtcConnection,
  SolidDataset,
  WebRtcConnection,
} from './SolidDataset';

const POD_URL = 'https://truthless.inrupt.net';

export interface AccessModes {
  read: boolean;
  append: boolean;
  write: boolean;
  controlRead: boolean;
  controlWrite: boolean;
}

const writeAccess: AccessModes = {
  read: true,
  append: true,
  write: true,
  controlRead: false,
  controlWrite: false,
};

const readAccess: AccessModes = {
  read: true,
  append: false,
  write: false,
  controlRead: false,
  controlWrite: false,
};

export const login = async (
  oidcIssuer = 'https://inrupt.net',
  redirectUrl = window.location.href,
  clientName = 'SyncedStore'
): Promise<Session> => {
  await handleIncomingRedirect({ restorePreviousSession: true });

  let session = getDefaultSession();

  if (!session.info.isLoggedIn) {
    await session.login({
      oidcIssuer: oidcIssuer,
      redirectUrl: redirectUrl,
      clientName: clientName,
    });
  }

  return session;
};

const logAccessInfoAll = (agentAccess: AgentAccess | null, dataset: any) => {
  let resource = dataset.internal_resourceInfo.sourceIri;
  console.log(`For resource::: ${resource}`);

  if (agentAccess) {
    for (const [agent, access] of Object.entries(agentAccess)) {
      console.log(`${agent}'s Access:: ${JSON.stringify(access)}`);
    }
  } else {
    console.log('No access info found');
  }
};

const logAccessInfo = (agent: any, agentAccess: any, resource: any) => {
  console.log(`For resource::: ${resource}`);
  if (agentAccess === null) {
    console.log(`Could not load ${agent}'s access details.`);
  } else {
    console.log(`${agent}'s Access:: ${JSON.stringify(agentAccess)}`);
  }
};

export const getAccessInfoWAC = async (
  datasetWithAcl: any
): Promise<AgentAccess | null> => {
  let accessByAgent = getAgentAccessAll(datasetWithAcl);

  logAccessInfoAll(accessByAgent, datasetWithAcl);

  return accessByAgent;
};

export const getPublicAccessInfo = async (
  datasetUrl = `${POD_URL}/yjs/docs`
) => {
  universalAccess
    .getPublicAccess(
      datasetUrl, // Resource
      { fetch: fetch } // fetch function from authenticated session
    )
    .then((returnedAccess) => {
      if (returnedAccess === null) {
        console.log('Could not load access details for this Resource.');
      } else {
        console.log(
          'Returned Public Access:: ',
          JSON.stringify(returnedAccess)
        );
      }
    });
};

export const getAgentAccessInfo = async (
  resourceUrl: string,
  webid: string
): Promise<AccessModes | null> => {
  let agentAccess = universalAccess.getAgentAccess(
    resourceUrl, // resource
    webid, // agent
    { fetch: fetch } // fetch function from authenticated session
  );

  logAccessInfo(webid, agentAccess, resourceUrl);

  return agentAccess;
};

export const setPublicAccess = async (
  resourceUrl: string,
  access: AccessModes
): Promise<AccessModes | null> => {
  let publicAccess = await universalAccess.setPublicAccess(
    resourceUrl, // Resource
    access, // Access
    { fetch: fetch } // fetch function from authenticated session
  );

  if (publicAccess === null) {
    console.log('Could not load access details for this Resource.');
  } else {
    console.log('Returned Public Access:: ', JSON.stringify(publicAccess));
  }

  return access;
};

export const setAgentAccess = async (
  resourceUrl: string,
  webId: string,
  access: AccessModes
) => {
  universalAccess
    .setAgentAccess(
      resourceUrl, // Resource
      webId, // Agent
      access, // Access
      { fetch: fetch } // fetch function from authenticated session
    )
    .then((returnedAccess) => {
      if (returnedAccess === null) {
        console.log('Could not load access details for this Resource.');
      } else {
        console.log('Returned Agent Access:: ', JSON.stringify(returnedAccess));
      }
    });
};

/**
 * Subscribe to a Solid resource via WebSocket.
 * Currently only supports NSS implementations of pods.
 *
 * @param resourceUrl
 * @param socketUrl
 * @returns A websocket connection to the resource
 */
const openSolidWebSocket = (
  resourceUrl: string,
  socketUrl: string = 'wss://inrupt.net/'
): WebSocket | null => {
  try {
    let websocket = new WebSocket(socketUrl, ['solid-0.1']);

    websocket.onopen = function () {
      this.send('sub ' + resourceUrl);
    };

    return websocket;
  } catch (e) {
    console.log('Could not connect to websocket', e);
  }

  return null;
};

const syncInterval = (fn: () => {}, interval: number = 5000) => {
  (async function i() {
    await fn();
    setTimeout(i, interval);
  })();
};

export interface Collaborator {
  webId: string;
  isCreator: boolean;
}

export class SolidPersistence extends Observable<string> {
  public name: string;
  public doc: Y.Doc;
  public loggedIn: boolean;
  public session: Session;
  public dataset: SolidDataset | null;
  public websocket: any;
  public updateInterval: number;

  private isUpdating: boolean;
  private updates: any[];
  private requiresFetch: boolean;
  private isFetching: boolean;

  private constructor(
    name: string,
    doc: Y.Doc,
    session: Session,
    dataset: SolidDataset | null,
    websocket: any,
    updateInterval: number
  ) {
    super();

    this.name = name;
    this.doc = doc;
    this.session = session;
    this.dataset = dataset;

    this.websocket = websocket;
    this.updateInterval = updateInterval;

    this.loggedIn = this.session.info.isLoggedIn;

    this.isUpdating = false;
    this.updates = [];
    this.isFetching = false;
    this.requiresFetch = false;

    // Currently also fetches when an update comes from this provider
    if (this.websocket) {
      this.websocket.onmessage = async (msg: any) => {
        if (msg.data && msg.data.slice(0, 3) === 'pub') {
          console.log('[Notification] Resource updated', msg);
          if (this.isUpdating || this.isFetching) {
            console.log(
              '[Notification] Update or fetch in progress, queueing fetch'
            );
            this.requiresFetch = true;
          } else {
            console.log('[Notification] Fetching pod');
            await this.fetch();
          }

          while (this.requiresFetch) {
            this.requiresFetch = false;
            await this.fetch();
          }
        }
      };
    }

    this.doc.on('update', (update, origin) => {
      if (origin !== this) {
        this.updates.push(update);
      }
    });

    syncInterval(async () => {
      if (this.updates.length > 0) {
        this.isUpdating = true;
        console.log(
          '[Solid] Processing ',
          this.updates.length,
          'queued updates'
        );
        await this.update(this.updates.splice(0));

        // if there are any notifications during the update, fetch the latest pod state
        if (this.requiresFetch) {
          console.log('[Solid] Additional fetching required');
          await this.fetch();
        }

        this.isUpdating = false;
        console.log('[Solid] Finished processing updates');
      } else {
        console.log('[Solid] No updates to process');
      }
    }, updateInterval);

    this.emit('created', [this]);
  }

  public static async create(
    name: string,
    doc: Y.Doc,
    autoLogin = false,
    resourceUrl = `${POD_URL}/yjs/docs`,
    socketUrl = 'wss://inrupt.net/',
    updateInterval: number = 10000
  ): Promise<SolidPersistence> {
    // LOGIN
    let session;
    if (autoLogin) {
      session = await login();
    } else {
      await handleIncomingRedirect({ restorePreviousSession: true });
      session = getDefaultSession();
    }

    // NOT LOGGED IN
    if (!session.info.isLoggedIn || !session.info.webId) {
      console.log('Not logged in');
      return new SolidPersistence(
        name,
        doc,
        session,
        null,
        null,
        updateInterval
      );
    }

    // LOAD DATASET
    let dataset = await SolidDataset.create(
      name,
      resourceUrl,
      session.info.webId
    );
    if (dataset.value.length > 0) Y.applyUpdate(doc, dataset.value, this);
    await dataset.update(Y.encodeStateAsUpdate(doc));

    let websocket = openSolidWebSocket(resourceUrl, socketUrl);

    return new SolidPersistence(
      name,
      doc,
      session,
      dataset,
      websocket,
      updateInterval
    );
  }

  public async update(updates: Uint8Array[]) {
    if (this.loggedIn && this.dataset) {
      await this.dataset.fetchAndUpdate(
        (value: Uint8Array) => Y.applyUpdate(this.doc, value, this),
        () => {
          Y.transact(
            this.doc,
            () => {
              updates.forEach((update) => {
                Y.applyUpdate(this.doc, update);
              });
            },
            this,
            false
          );
        },
        () => Y.encodeStateAsUpdate(this.doc)
      );
    } else {
      console.log('Cannot sync update - not logged in');
    }
  }

  public async fetch() {
    this.isFetching = true;

    if (this.loggedIn && this.dataset) {
      await this.dataset.fetch();
      Y.applyUpdate(this.doc, this.dataset.value, this);

      console.log('Fetched from pod');
      this.requiresFetch = false;
    } else {
      console.log('Cannot fetch - not logged in');
    }

    this.isFetching = false;
  }

  public async setAgentAccess(
    webId: string,
    access: AccessModes = writeAccess
  ) {
    if (this.loggedIn && this.dataset) {
      await setAgentAccess(this.dataset.url, webId, access);
    } else {
      console.log('Cannot set access - not logged in');
    }
  }

  public async setPublicAccess(access: AccessModes = readAccess) {
    if (this.loggedIn && this.dataset) {
      await setPublicAccess(this.dataset.url, access);
    } else {
      console.log('Cannot set access - not logged in');
    }
  }

  public getWebRtcConnection(): WebRtcConnection {
    if (this.loggedIn && this.dataset) {
      let connection = this.dataset.getWebRtcConnection();

      if (!connection) {
        connection = randomWebRtcConnection();
        this.dataset.addWebRtcConnection(connection);
      }

      return connection;
    } else {
      console.log(
        '[SolidProvider] not logged in - creating a random WebRTC connection'
      );
      return randomWebRtcConnection();
    }
  }

  public getCollaborators(): Collaborator[] {
    let collaborators: Collaborator[] = [];
    if (this.loggedIn && this.dataset) {
      collaborators.push({
        webId: this.dataset.creator || 'unknown',
        isCreator: true,
      });
      collaborators.push(
        ...this.dataset.contributors.map((webId) => ({
          webId,
          isCreator: false,
        }))
      );
    } else {
      console.log('Cannot get collaborators - not logged in');
    }

    return collaborators;
  }

  public async addWriteAccess(webId: string) {
    if (this.loggedIn && this.dataset) {
      await setAgentAccess(this.dataset.url, webId, writeAccess);
    } else {
      console.log('Cannot add collaborator - not logged in');
    }
  }

  public async addReadAccess(webId: string) {
    if (this.loggedIn && this.dataset) {
      await setAgentAccess(this.dataset.url, webId, readAccess);
    } else {
      console.log('Cannot add collaborator - not logged in');
    }
  }
}
