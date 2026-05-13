import { IsOptional, IsUrl } from 'class-validator';

export class SocialRedirectQueryDto {
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  redirectTo?: string;
}
