export type UserRole = 'ADMIN' | 'EDITOR';

export interface UserProp {
    id: string;
    name: string | null;
    role: UserRole;
    email: string;
    avatar: string | null;
}
