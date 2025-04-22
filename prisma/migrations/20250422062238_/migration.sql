-- CreateTable
CREATE TABLE "blog_blog_categories" (
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blog_id" TEXT NOT NULL,
    "blog_category_id" TEXT NOT NULL,

    CONSTRAINT "blog_blog_categories_pkey" PRIMARY KEY ("blog_id","blog_category_id")
);

-- AddForeignKey
ALTER TABLE "blog_blog_categories" ADD CONSTRAINT "blog_blog_categories_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_blog_categories" ADD CONSTRAINT "blog_blog_categories_blog_category_id_fkey" FOREIGN KEY ("blog_category_id") REFERENCES "blog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
