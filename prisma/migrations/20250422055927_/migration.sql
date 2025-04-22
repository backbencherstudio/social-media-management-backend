-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "schedule_at" TIMESTAMP(3),
    "content" TEXT,
    "hashtags" TEXT[],

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_channels" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "post_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,

    CONSTRAINT "post_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_files" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "status" SMALLINT DEFAULT 1,
    "sort_order" INTEGER DEFAULT 0,
    "post_id" TEXT,
    "name" TEXT,
    "type" TEXT,
    "size" INTEGER,
    "file_path" TEXT,
    "file_alt" TEXT,

    CONSTRAINT "post_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "post_channels" ADD CONSTRAINT "post_channels_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_channels" ADD CONSTRAINT "post_channels_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_files" ADD CONSTRAINT "post_files_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
