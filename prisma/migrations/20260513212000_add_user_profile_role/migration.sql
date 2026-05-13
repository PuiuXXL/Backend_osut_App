-- CreateEnum
CREATE TYPE "ProfileRole" AS ENUM (
    'INACTIVE_VOLUNTEER',
    'VOLUNTEER',
    'MEMBER',
    'ACTIVE_MEMBER'
);

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "profileRole" "ProfileRole" NOT NULL DEFAULT 'INACTIVE_VOLUNTEER';
