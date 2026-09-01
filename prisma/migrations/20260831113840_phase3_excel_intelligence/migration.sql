-- CreateEnum
CREATE TYPE "WorkbookStatus" AS ENUM ('UPLOADED', 'PROFILED', 'MAPPING_REVIEW', 'VALIDATED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkbookShape" AS ENUM ('WIDE', 'LONG', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MappingVersionStatus" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "MappingKind" AS ENUM ('COLUMN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MappingSuggestionStatus" AS ENUM ('SUGGESTED', 'REVIEW_REQUIRED', 'APPROVED', 'REJECTED', 'OVERRIDDEN');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('VALIDATING', 'VALIDATION_FAILED', 'IMPORTED', 'FAILED');

-- CreateTable
CREATE TABLE "ExcelWorkbook" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "sanitizedFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "status" "WorkbookStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcelWorkbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkbookProfile" (
    "id" UUID NOT NULL,
    "workbookId" UUID NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "primaryShape" "WorkbookShape" NOT NULL,
    "sheetCount" INTEGER NOT NULL,
    "formulaCount" INTEGER NOT NULL,
    "hiddenSheetCount" INTEGER NOT NULL,
    "mergedCellCount" INTEGER NOT NULL,
    "profile" JSONB NOT NULL,
    "profiledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkbookProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MappingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingVersion" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "workbookId" UUID,
    "version" INTEGER NOT NULL,
    "status" "MappingVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "schemaFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "MappingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingRule" (
    "id" UUID NOT NULL,
    "mappingVersionId" UUID NOT NULL,
    "kind" "MappingKind" NOT NULL,
    "sourceField" TEXT NOT NULL,
    "targetConcept" TEXT NOT NULL,
    "targetMemberId" TEXT,
    "confidence" DECIMAL(5,4) NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "MappingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingSuggestion" (
    "id" UUID NOT NULL,
    "mappingVersionId" UUID NOT NULL,
    "kind" "MappingKind" NOT NULL,
    "sourceValue" TEXT NOT NULL,
    "targetConcept" TEXT NOT NULL,
    "suggestedTargetId" TEXT,
    "confidence" DECIMAL(5,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MappingSuggestionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MappingSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MappingDecision" (
    "id" UUID NOT NULL,
    "suggestionId" UUID NOT NULL,
    "decidedById" UUID NOT NULL,
    "decision" "MappingSuggestionStatus" NOT NULL,
    "selectedTargetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MappingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workbookId" UUID NOT NULL,
    "mappingVersionId" UUID NOT NULL,
    "importedById" UUID NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'VALIDATING',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedRowCount" INTEGER NOT NULL DEFAULT 0,
    "sourceTotals" JSONB,
    "resultMetrics" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" UUID NOT NULL,
    "importBatchId" UUID NOT NULL,
    "rowNumber" INTEGER,
    "code" TEXT NOT NULL,
    "field" TEXT,
    "sourceValue" TEXT,
    "message" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "evidence" JSONB,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExcelWorkbook_organizationId_uploadedAt_idx" ON "ExcelWorkbook"("organizationId", "uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExcelWorkbook_organizationId_sha256_key" ON "ExcelWorkbook"("organizationId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "WorkbookProfile_workbookId_key" ON "WorkbookProfile"("workbookId");

-- CreateIndex
CREATE INDEX "WorkbookProfile_fingerprint_idx" ON "WorkbookProfile"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "MappingTemplate_organizationId_fingerprint_key" ON "MappingTemplate"("organizationId", "fingerprint");

-- CreateIndex
CREATE INDEX "MappingVersion_workbookId_idx" ON "MappingVersion"("workbookId");

-- CreateIndex
CREATE UNIQUE INDEX "MappingVersion_templateId_version_key" ON "MappingVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MappingRule_mappingVersionId_kind_sourceField_targetConcept_key" ON "MappingRule"("mappingVersionId", "kind", "sourceField", "targetConcept");

-- CreateIndex
CREATE UNIQUE INDEX "MappingSuggestion_mappingVersionId_kind_sourceValue_targetC_key" ON "MappingSuggestion"("mappingVersionId", "kind", "sourceValue", "targetConcept");

-- CreateIndex
CREATE UNIQUE INDEX "MappingDecision_suggestionId_key" ON "MappingDecision"("suggestionId");

-- CreateIndex
CREATE INDEX "ImportBatch_organizationId_startedAt_idx" ON "ImportBatch"("organizationId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportBatch_workbookId_mappingVersionId_key" ON "ImportBatch"("workbookId", "mappingVersionId");

-- CreateIndex
CREATE INDEX "ImportError_importBatchId_blocking_idx" ON "ImportError"("importBatchId", "blocking");

-- AddForeignKey
ALTER TABLE "ExcelWorkbook" ADD CONSTRAINT "ExcelWorkbook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkbookProfile" ADD CONSTRAINT "WorkbookProfile_workbookId_fkey" FOREIGN KEY ("workbookId") REFERENCES "ExcelWorkbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingTemplate" ADD CONSTRAINT "MappingTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingVersion" ADD CONSTRAINT "MappingVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MappingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingVersion" ADD CONSTRAINT "MappingVersion_workbookId_fkey" FOREIGN KEY ("workbookId") REFERENCES "ExcelWorkbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingRule" ADD CONSTRAINT "MappingRule_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingSuggestion" ADD CONSTRAINT "MappingSuggestion_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingDecision" ADD CONSTRAINT "MappingDecision_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MappingSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MappingDecision" ADD CONSTRAINT "MappingDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_workbookId_fkey" FOREIGN KEY ("workbookId") REFERENCES "ExcelWorkbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_mappingVersionId_fkey" FOREIGN KEY ("mappingVersionId") REFERENCES "MappingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError" ADD CONSTRAINT "ImportError_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
