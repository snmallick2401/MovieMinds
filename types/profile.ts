export type Profile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  libraryPublic: boolean;
  createdAt: Date;
};
