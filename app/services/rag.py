from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# load model once at startup — saves memory and time
model = SentenceTransformer("all-MiniLM-L6-v2")


def build_faiss_index(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_text(text)

    embeddings = model.encode(chunks)
    embeddings = np.array(embeddings).astype("float32")

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    return index, chunks


def retrieve_chunks(query, index, chunks, k=3):
    query_vector = model.encode([query]).astype("float32")

    distances, indices = index.search(query_vector, k)

    results = [chunks[i] for i in indices[0]]
    return results