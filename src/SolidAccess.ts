import {
  universalAccess,
  getAgentAccessAll,
  AgentAccess,
} from '@inrupt/solid-client';

export interface AccessModes {
  read: boolean;
  append: boolean;
  write: boolean;
  controlRead: boolean;
  controlWrite: boolean;
}

export const writeAccess: AccessModes = {
  read: true,
  append: true,
  write: true,
  controlRead: false,
  controlWrite: false,
};

export const readAccess: AccessModes = {
  read: true,
  append: false,
  write: false,
  controlRead: false,
  controlWrite: false,
};

const logAccessInfoAll = (agentAccess: AgentAccess | null, dataset: any) => {
  const resource = dataset.internal_resourceInfo.sourceIri;
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
  datasetWithAcl: any,
): Promise<AgentAccess | null> => {
  const accessByAgent = getAgentAccessAll(datasetWithAcl);

  logAccessInfoAll(accessByAgent, datasetWithAcl);

  return accessByAgent;
};

export const getPublicAccessInfo = async (datasetUrl: string) => {
  universalAccess
    .getPublicAccess(
      datasetUrl, // Resource
      { fetch: fetch }, // fetch function from authenticated session
    )
    .then((returnedAccess) => {
      if (returnedAccess === null) {
        console.log('Could not load access details for this Resource.');
      } else {
        console.log(
          'Returned Public Access:: ',
          JSON.stringify(returnedAccess),
        );
      }
    });
};

export const getAgentAccessInfo = async (
  resourceUrl: string,
  webid: string,
): Promise<AccessModes | null> => {
  const agentAccess = universalAccess.getAgentAccess(
    resourceUrl, // resource
    webid, // agent
    { fetch: fetch }, // fetch function from authenticated session
  );

  logAccessInfo(webid, agentAccess, resourceUrl);

  return agentAccess;
};

export const setPublicAccess = async (
  resourceUrl: string,
  access: AccessModes,
): Promise<AccessModes | null> => {
  const publicAccess = await universalAccess.setPublicAccess(
    resourceUrl, // Resource
    access, // Access
    { fetch: fetch }, // fetch function from authenticated session
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
  access: AccessModes,
) => {
  universalAccess
    .setAgentAccess(
      resourceUrl, // Resource
      webId, // Agent
      access, // Access
      { fetch: fetch }, // fetch function from authenticated session
    )
    .then((returnedAccess) => {
      if (returnedAccess === null) {
        console.log('Could not load access details for this Resource.');
      } else {
        console.log('Returned Agent Access:: ', JSON.stringify(returnedAccess));
      }
    });
};
