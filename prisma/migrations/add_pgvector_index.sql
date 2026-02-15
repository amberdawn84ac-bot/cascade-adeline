CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS hippocampus_embedding_idx 
ON "HippocampusDocument" 
USING hnsw (embedding vector_cosine_ops);
