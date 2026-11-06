import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.Client()

collection = client.get_or_create_collection("job_memory")


def store_job(job):

    embedding = model.encode(job["description"]).tolist()

    collection.add(
        ids=[job["link"]],
        embeddings=[embedding],
        documents=[job["description"]],
        metadatas=[job]
    )


def recommend_jobs(resume):

    embedding = model.encode(resume).tolist()

    results = collection.query(
        query_embeddings=[embedding],
        n_results=5
    )

    return results