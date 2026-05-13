import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MembershipRole,
  SystemRole,
  type Announcement,
} from '@prisma/client';
import type { JWTPayload as JoseJWTPayload } from 'jose';
import { prisma } from '../prisma/prisma.client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import type { AnnouncementDetail } from './types/announcement-detail.type';
import type { AnnouncementListItem } from './types/announcement-list-item.type';

const announcementDetailInclude = {
  author: {
    select: {
      id: true,
      displayName: true,
    },
  },
  department: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

@Injectable()
export class AnnouncementsService {
  async createAnnouncement(
    authUser: JoseJWTPayload | undefined,
    createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<AnnouncementDetail> {
    const userId = this.extractUserId(authUser);
    const user = await this.getUserOrThrow(userId);

    if (createAnnouncementDto.departmentId) {
      await this.assertCanCreateDepartmentAnnouncement(
        user.id,
        user.systemRole,
        createAnnouncementDto.departmentId,
      );
    } else {
      this.assertIsAdmin(user.systemRole);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: createAnnouncementDto.title,
        description: createAnnouncementDto.description,
        imageUrl: createAnnouncementDto.imageUrl ?? null,
        authorId: user.id,
        departmentId: createAnnouncementDto.departmentId ?? null,
      },
      include: announcementDetailInclude,
    });

    return this.mapAnnouncementToDetail(announcement);
  }

  async listGeneralAnnouncements(): Promise<AnnouncementListItem[]> {
    const announcements = await prisma.announcement.findMany({
      where: {
        departmentId: null,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      imageUrl: announcement.imageUrl ?? null,
      createdAt: announcement.createdAt,
    }));
  }

  async listDepartmentAnnouncements(departmentId: string): Promise<AnnouncementListItem[]> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        departmentId,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      imageUrl: announcement.imageUrl ?? null,
      createdAt: announcement.createdAt,
    }));
  }

  async getAnnouncementById(announcementId: string): Promise<AnnouncementDetail> {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: announcementDetailInclude,
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return this.mapAnnouncementToDetail(announcement);
  }

  async updateAnnouncement(
    authUser: JoseJWTPayload | undefined,
    announcementId: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
  ): Promise<AnnouncementDetail> {
    const userId = this.extractUserId(authUser);
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existingAnnouncement) {
      throw new NotFoundException('Announcement not found');
    }

    if (existingAnnouncement.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this announcement');
    }

    if (Object.keys(updateAnnouncementDto).length === 0) {
      throw new BadRequestException('At least one field must be provided for update');
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: updateAnnouncementDto.title,
        description: updateAnnouncementDto.description,
        imageUrl: updateAnnouncementDto.imageUrl,
      },
      include: announcementDetailInclude,
    });

    return this.mapAnnouncementToDetail(updatedAnnouncement);
  }

  private async assertCanCreateDepartmentAnnouncement(
    userId: string,
    systemRole: SystemRole,
    departmentId: string,
  ) {
    if (systemRole === SystemRole.ADMIN) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      return;
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      throw new ForbiddenException(
        'Only coordinators of the target department can create department announcements',
      );
    }

    if (
      membership.role !== MembershipRole.CO_COORDINATOR &&
      membership.role !== MembershipRole.COORDINATOR
    ) {
      throw new ForbiddenException(
        'Only coordinators of the target department can create department announcements',
      );
    }
  }

  private assertIsAdmin(systemRole: SystemRole) {
    if (systemRole !== SystemRole.ADMIN) {
      throw new ForbiddenException('Only admins can create general announcements');
    }
  }

  private async getUserOrThrow(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        systemRole: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private extractUserId(authUser: JoseJWTPayload | undefined) {
    const userId = authUser?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user is missing an id');
    }

    return userId;
  }

  private mapAnnouncementToDetail(
    announcement: Announcement & {
      author: {
        id: string;
        displayName: string;
      };
      department: {
        id: string;
        name: string;
      } | null;
    },
  ): AnnouncementDetail {
    return {
      id: announcement.id,
      title: announcement.title,
      description: announcement.description,
      imageUrl: announcement.imageUrl ?? null,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      author: announcement.author,
      department: announcement.department,
    };
  }
}
