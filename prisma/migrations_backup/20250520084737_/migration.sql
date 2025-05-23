-- CreateTable
CREATE TABLE "_OrderAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OrderAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_OrderAssignees_B_index" ON "_OrderAssignees"("B");

-- AddForeignKey
ALTER TABLE "_OrderAssignees" ADD CONSTRAINT "_OrderAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderAssignees" ADD CONSTRAINT "_OrderAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
