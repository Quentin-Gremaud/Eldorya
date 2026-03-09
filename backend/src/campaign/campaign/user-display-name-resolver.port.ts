export interface UserDisplayNameResolver {
  resolve(userId: string): Promise<string>;
}

export const USER_DISPLAY_NAME_RESOLVER = 'USER_DISPLAY_NAME_RESOLVER';
