CREATE TABLE "RestaurantSettings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'default',
    "restaurantName" VARCHAR(100) NOT NULL DEFAULT 'Terrasse Bleue',
    "address" VARCHAR(255) NOT NULL DEFAULT 'Essaouira, Maroc',
    "contactPhone" VARCHAR(30),
    "contactEmail" VARCHAR(255),
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "acceptsOrders" BOOLEAN NOT NULL DEFAULT true,
    "estimatedPrepMinutes" INTEGER NOT NULL DEFAULT 25,
    "notificationSound" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RestaurantSettings_pkey" PRIMARY KEY ("id")
);
