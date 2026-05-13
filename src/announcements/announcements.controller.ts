import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { JWTPayload } from 'jose';
import { CurrentAuthUser } from '../auth/decorators/current-auth-user.decorator';
import { BetterAuthJwtGuard } from '../auth/guards/better-auth-jwt.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(BetterAuthJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'The authenticated user is not allowed to create this announcement' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async createAnnouncement(
    @CurrentAuthUser() authUser: JWTPayload | undefined,
    @Body() createAnnouncementDto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.createAnnouncement(
      authUser,
      createAnnouncementDto,
    );
  }

  @Get('general')
  @ApiOperation({ summary: 'List all general announcements in minimal format' })
  @ApiResponse({ status: 200, description: 'General announcements returned successfully' })
  async listGeneralAnnouncements() {
    return this.announcementsService.listGeneralAnnouncements();
  }

  @Get('departments/:departmentId')
  @ApiOperation({ summary: 'List all announcements for a department in minimal format' })
  @ApiParam({ name: 'departmentId', description: 'The id of the department' })
  @ApiResponse({ status: 200, description: 'Department announcements returned successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async listDepartmentAnnouncements(@Param('departmentId') departmentId: string) {
    return this.announcementsService.listDepartmentAnnouncements(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get the full details of a single announcement' })
  @ApiParam({ name: 'id', description: 'The id of the announcement' })
  @ApiResponse({ status: 200, description: 'Announcement returned successfully' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async getAnnouncementById(@Param('id') announcementId: string) {
    return this.announcementsService.getAnnouncementById(announcementId);
  }

  @Patch(':id')
  @UseGuards(BetterAuthJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit an announcement as its author' })
  @ApiParam({ name: 'id', description: 'The id of the announcement to update' })
  @ApiBody({ type: UpdateAnnouncementDto })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update payload' })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Only the author may edit the announcement' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async updateAnnouncement(
    @CurrentAuthUser() authUser: JWTPayload | undefined,
    @Param('id') announcementId: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.updateAnnouncement(
      authUser,
      announcementId,
      updateAnnouncementDto,
    );
  }
}
