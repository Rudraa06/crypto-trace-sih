import fastapi
from fastapi import FastAPI, HTTPException
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field
from neo4j import GraphDatabase
import networkx as nx
from models.gnn_detector import predict_otc_risk
import os

app = FastAPI(title="CryptoTrace ML Microservice", version="1.0.0")

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")

# Use environment variables or fallback to standard neo4j local auth
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASSWORD")

if not NEO4J_PASS:
    raise RuntimeError("NEO4J_PASSWORD environment variable is required.")
if not INTERNAL_API_KEY:
    print("Warning: INTERNAL_API_KEY not set. API calls will be rejected.")

class PredictionRequest(BaseModel):
    address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$", description="Ethereum wallet address")

def fetch_ego_graph(address: str) -> nx.DiGraph:
    """
    Connects to Neo4j, extracts a 2-hop ego network around the address,
    and returns a NetworkX DiGraph for GNN feature extraction.
    """
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    
    query = """
    MATCH path = (n)-[:TRANSACTION*1..2]-(m)
    WHERE n.address = $address OR m.address = $address
    RETURN path
    """
    
    G = nx.DiGraph()
    try:
        with driver.session() as session:
            result = session.run(query, address=address)
            for record in result:
                path = record["path"]
                # Neo4j python driver paths contain nodes and relationships
                for rel in path.relationships:
                    start_node = rel.start_node["address"]
                    end_node = rel.end_node["address"]
                    # Optionally extract timestamps or usdValues if present
                    timestamp = rel.get("timestamp", 0)
                    G.add_edge(start_node, end_node, timestamp=timestamp)
    except Exception as e:
        print(f"Neo4j extraction error: {e}")
    finally:
        driver.close()
        
    return G

@app.post("/predict/otc-risk")
async def predict_otc(req: PredictionRequest, api_key: str = fastapi.Depends(api_key_header)):
    """
    Endpoint to predict if a given wallet address belongs to an OTC broker.
    Extracts the local graph topology from Neo4j and runs it through the GNN model.
    """
    if INTERNAL_API_KEY and api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    if not req.address:
        raise HTTPException(status_code=400, detail="Address is required")

    # 1. Extract 2-hop network from Neo4j
    graph = fetch_ego_graph(req.address)
    
    if len(graph.nodes) == 0:
        return {
            "address": req.address,
            "is_otc": False,
            "confidence": 0.0,
            "message": "Node not found in graph or isolated."
        }

    # 2. Run GNN classification
    result = predict_otc_risk(req.address, graph)
    
    return result

if __name__ == "__main__":
    import uvicorn
    # Run locally on 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
