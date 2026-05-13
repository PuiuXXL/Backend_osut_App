import { IsOptional, IsString, IsUUID, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
