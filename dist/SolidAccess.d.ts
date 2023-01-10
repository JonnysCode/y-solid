import { AgentAccess } from '@inrupt/solid-client';
export interface AccessModes {
    read: boolean;
    append: boolean;
    write: boolean;
    controlRead: boolean;
    controlWrite: boolean;
}
export declare const writeAccess: AccessModes;
export declare const readAccess: AccessModes;
export declare const getAccessInfoWAC: (datasetWithAcl: any) => Promise<AgentAccess | null>;
export declare const getPublicAccessInfo: (datasetUrl: string) => Promise<void>;
export declare const getAgentAccessInfo: (resourceUrl: string, webid: string) => Promise<AccessModes | null>;
export declare const setPublicAccess: (resourceUrl: string, access: AccessModes) => Promise<AccessModes | null>;
export declare const setAgentAccess: (resourceUrl: string, webId: string, access: AccessModes) => Promise<void>;
