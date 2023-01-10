import { Session } from '@inrupt/solid-client-authn-browser';
export declare const login: (oidcIssuer?: string, redirectUrl?: string, clientName?: string) => Promise<Session>;
export declare function RequireAuth(target: any, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
