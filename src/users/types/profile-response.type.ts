export type UserProfileResponse = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: 'INACTIVE_VOLUNTEER' | 'VOLUNTEER' | 'MEMBER' | 'ACTIVE_MEMBER';
  coordinatorTeams: string[];
  coordinatorTeamsDisplay: string;
};
