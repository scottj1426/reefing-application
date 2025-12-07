-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "notes" TEXT,
    "aquarium_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corals" (
    "id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "placement" TEXT,
    "color" TEXT,
    "size" TEXT,
    "acquisition_date" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,
    "aquarium_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corals" ADD CONSTRAINT "corals_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
