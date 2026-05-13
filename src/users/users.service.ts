import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MembershipRole, Prisma, type ProfileRole } from '@prisma/client';
import type { JWTPayload } from 'jose';
import { prisma } from '../prisma/prisma.client';
import type { UserProfileResponse } from './types/profile-response.type';

const coordinatorRoles = [
  MembershipRole.CO_COORDINATOR,
  MembershipRole.COORDINATOR,
] satisfies MembershipRole[];

const userProfileInclude = {
  memberships: {
    where: {
      role: {
        in: coordinatorRoles,
      },
    },
    include: {
      department: true,
    },
  },
} satisfies Prisma.UserInclude;

type UserWithCoordinatorMemberships = Prisma.UserGetPayload<{
  include: typeof userProfileInclude;
}>;

@Injectable()
export class UsersService {
  async getMyProfile(authUser: JWTPayload | undefined) {
    const userId = this.extractUserId(authUser);
    return this.getProfileById(userId);
  }

  async getProfileById(userId: string): Promise<UserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: userProfileInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToProfile(user);
  }

  private extractUserId(authUser: JWTPayload | undefined) {
    const userId = authUser?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is missing an id');
    }

    return userId;
  }

  private mapUserToProfile(user: UserWithCoordinatorMemberships): UserProfileResponse {
    const coordinatorTeams = user.memberships.map(
      (membership) => membership.department.name,
    );

    return {
      id: user.id,
      displayName: user.displayName,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      email: user.email,
      role: this.mapProfileRole(user.profileRole),
      coordinatorTeams,
      coordinatorTeamsDisplay:
        coordinatorTeams.length > 0 ? coordinatorTeams.join(', ') : '-',
    };
  }

  private mapProfileRole(profileRole: ProfileRole): UserProfileResponse['role'] {
    return profileRole;
  }
}
