import { Observable } from 'lib0/observable';
import * as logging from 'lib0/logging';
import * as Y from 'yjs';
import {
  handleIncomingRedirect,
  getDefaultSession,
  Session,
} from '@inrupt/solid-client-authn-browser';

import {
  randomWebRtcConnection,
  SolidDataset,
  WebRtcConnection,
} from './SolidDataset';
import {
  AccessModes,
  readAccess,
  setAgentAccess,
  setPublicAccess,
  writeAccess,
} from './SolidAccess';
import { openSolidWebSocket } from './SolidNotifications';
import { RequireAuth, login } from './SolidAuth';

const log = logging.createModuleLogger('solid-persistence');

export interface Collaborator {
  webId: string;
  isCreator: boolean;
}

const syncInterval = (fn: () => void, interval = 5000) => {
  (async function i() {
    await fn();
    setTimeout(i, interval);
  })();
};

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
    updateInterval: number,
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
          log('[Notification] Resource updated', msg);
          if (this.isUpdating || this.isFetching) {
            log('[Notification] Update or fetch in progress, queueing fetch');
            this.requiresFetch = true;
          } else {
            log('[Notification] Fetching pod');
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
        log('[Solid] Processing ', this.updates.length, 'queued updates');
        await this.update(this.updates.splice(0));

        // if there are any notifications during the update, fetch the latest pod state
        if (this.requiresFetch) {
          log('[Solid] Additional fetching required');
          await this.fetch();
        }

        this.isUpdating = false;
        log('[Solid] Finished processing updates');
      } else {
        log('[Solid] No updates to process');
      }
    }, updateInterval);

    this.emit('created', [this]);
  }

  public static async create(
    name: string,
    doc: Y.Doc,
    autoLogin = false,
    resourceUrl: string | undefined,
    socketUrl = 'wss://inrupt.net/',
    updateInterval = 10000,
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
      log(logging.ORANGE, 'Not logged in');
      return new SolidPersistence(
        name,
        doc,
        session,
        null,
        null,
        updateInterval,
      );
    }

    // LOAD DATASET
    const dataset = await SolidDataset.create(
      name,
      resourceUrl,
      session.info.webId,
    );
    if (dataset.value.length > 0) Y.applyUpdate(doc, dataset.value, this);
    await dataset.update(Y.encodeStateAsUpdate(doc));

    const websocket = openSolidWebSocket(resourceUrl, socketUrl);

    return new SolidPersistence(
      name,
      doc,
      session,
      dataset,
      websocket,
      updateInterval,
    );
  }

  @RequireAuth
  public async update(updates: Uint8Array[]) {
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
          false,
        );
      },
      () => Y.encodeStateAsUpdate(this.doc),
    );
  }

  @RequireAuth
  public async fetch() {
    this.isFetching = true;

    await this.dataset.fetch();
    Y.applyUpdate(this.doc, this.dataset.value, this);

    log('Fetched from pod');
    this.requiresFetch = false;
    this.isFetching = false;
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
      log(
        logging.ORANGE,
        'Not authenticated - creating a random WebRTC connection',
      );
      return randomWebRtcConnection();
    }
  }

  @RequireAuth
  public getCollaborators(): Collaborator[] {
    const collaborators: Collaborator[] = [];
    collaborators.push({
      webId: this.dataset.creator || 'unknown',
      isCreator: true,
    });
    collaborators.push(
      ...this.dataset.contributors.map((webId) => ({
        webId,
        isCreator: false,
      })),
    );

    return collaborators;
  }

  @RequireAuth
  public async setAgentAccess(
    webId: string,
    access: AccessModes = writeAccess,
  ) {
    await setAgentAccess(this.dataset.url, webId, access);
  }

  @RequireAuth
  public async setPublicAccess(access: AccessModes = readAccess) {
    await setPublicAccess(this.dataset.url, access);
  }

  @RequireAuth
  public async addWriteAccess(webId: string) {
    await setAgentAccess(this.dataset.url, webId, writeAccess);
  }

  @RequireAuth
  public async addReadAccess(webId: string) {
    await setAgentAccess(this.dataset.url, webId, readAccess);
  }
}
