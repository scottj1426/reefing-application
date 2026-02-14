/*
  Warnings:

  - You are about to drop the column `image_key` on the `aquariums` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "aquariums" DROP COLUMN "image_key";

-- CreateTable
CREATE TABLE "aquarium_photos" (
    "id" TEXT NOT NULL,
    "image_key" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aquarium_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "aquarium_photos" ADD CONSTRAINT "aquarium_photos_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
