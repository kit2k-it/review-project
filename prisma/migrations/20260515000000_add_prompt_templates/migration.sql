-- Create PromptTemplate table
CREATE TABLE "PromptTemplate" (
    id TEXT PRIMARY KEY DEFAULT cuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP(3) NOT NULL
);

-- Create index on name
CREATE INDEX "PromptTemplate_name_idx" ON "PromptTemplate"(name);
