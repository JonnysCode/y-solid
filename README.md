# y-solid

> An experimental Solid Protocol provider for Yjs

## Installation

<pre><div class="bg-black mb-4 rounded-md"><div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy code</button></div><div class="p-4 overflow-y-auto"><code class="!whitespace-pre-wrap hljs language-scss">npm install y-solid
</code></div></div></pre>

## Usage

First, import the class:

<pre><div class="bg-black mb-4 rounded-md"><div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy code</button></div><div class="p-4 overflow-y-auto"><code class="!whitespace-pre-wrap hljs language-javascript">import { SolidPersistence } from 'y-solid'
import * as Y from 'yjs'
</code></div></div></pre>

Then, you can create an instance of the class by calling the `create` method:

<pre><div class="bg-black mb-4 rounded-md"><div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy code</button></div><div class="p-4 overflow-y-auto"><code class="!whitespace-pre-wrap hljs language-javascript">const doc = new Y.Doc();
const solidPersistence = await SolidPersistence.create(
  'my-dataset',
  doc,
  true, // automatically login
  'https://mypod.com/path/to/dataset'
);
</code></div></div></pre>

The `create` method takes several arguments:

- `name` (string): The name of the dataset.
- `doc` (Y.Doc): The Yjs document that needs to be synced.
- `autoLogin` (boolean, optional, default: `false`): Whether to automatically login.
- `resourceUrl` (string, optional): The URL of the dataset on the Solid POD.
- `socketUrl` (string, optional, default: `'wss://inrupt.net/'`): The URL of the WebSocket connection.
- `updateInterval` (number, optional, default: `10000`): The update interval.

After creating an instance of the class, you can use it to perform operations such as fetching updates from the POD and updating the dataset.

### In Local-First Applications

`y-solid` works great in combination with `y-indexeddb` and `y-webrtc`. This way you can create local-first web applications with backup/secondary data storage and access control in a users private data pod.

<pre><div class="bg-black mb-4 rounded-md"><div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy code</button></div><div class="p-4 overflow-y-auto"><code class="!whitespace-pre-wrap hljs language-javascript">import { SolidPersistence } from 'y-solid'
import * as Y from 'yjs'

const doc = new Y.Doc();
const docName = 'my-doc';

const indexeddb = new IndexeddbPersistence(docName, ydoc)

const solid = await SolidPersistence.create(
  docName,
  doc,
  true, // automatically login
  'https://mypod.com/path/to/dataset'
);

const connection = solid.getWebRtcConnection();
const webrtcProvider = new WebrtcProvider(connection.room, doc);
</code></div></div></pre>

## API

### Properties

- `name` (string): The name of the dataset.
- `doc` (Y.Doc): The Yjs document that needs to be synced.
- `loggedIn` (boolean): Whether the user is logged in.
- `session` (Session): The SolidAuthClient session.
- `dataset` (SolidDataset | null): The SolidDataset instance.
- `websocket` (any): The WebSocket connection.
- `updateInterval` (number): The update interval.

### Methods

##### `static async create(name: string, doc: Y.Doc, autoLogin = false, resourceUrl: string | undefined, socketUrl = 'wss://inrupt.net/', updateInterval = 10000): Promise<SolidPersistence>`

Creates a new instance of the class SolidPersistence with some defaults.

- `name: string` the name of the Solid document.
- `doc: Y.Doc` the yjs document.
- `autoLogin = false` whether or not to automatically try and login the user.
- `resourceUrl: string | undefined` the URL of the resource.
- `socketUrl = 'wss://inrupt.net/'` the URL of the websocket.
- `updateInterval = 10000` the update interval.

##### `fetch(): Promise<void>`

This method fetches the current state of the resource from the POD and updates the local Yjs document accordingly.

##### `update(updates: any[]): Promise<void>`

This method uploads the updates made to the local Yjs document to the resource on the POD.

- `updates`: An array of updates that needs to be pushed to the POD

##### `getCollaborators(): Collaborator[]`

Retrieves the collaborators of the current document.

- Return : An array of Collaborator objects containing the `webId` and a boolean `isCreator` indicating whether the collaborator created the document or not.

##### `async addAgentAccess(webId: string, access: AccessModes = writeAccess)`

Give a specified agent access to the current document.

- `webId: string` the webId of the agent.
- `access: AccessModes` (default `writeAccess`) the level of access the agent will have.

##### `async addPublicAccess(access: AccessModes = readAccess)`

Give the public access to the current document.

- `access: AccessModes` (default `readAccess`) the level of access the public will have.

##### `async addWriteAccess(webId: string)`

Give a specified agent write access to the current document.

- `webId: string` the webId of the agent.

##### `async addReadAccess(webId: string)`

Give a specified agent read access to the current document.

- `webId: string` the webId of the agent.

All methods above are decorated with @RequireAuth, which will check whether the user is authenticated before running the methods. If not authenticated it will log an error message with lib0/logging.
