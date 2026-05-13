import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  imageUrl?: string;
}
