from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from neo4j import GraphDatabase
import networkx as nx
from models.gnn_detector import predict_otc_risk
import os

app = FastAPI(title="CryptoTrace ML Microservice", version="1.0.0")

# Use environment variables or fallback to standard neo4j local auth
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASSWORD")

if not NEO4J_PASS:
    raise RuntimeError("NEO4J_PASSWORD environment variable is required.")

class PredictionRequest(BaseModel):
    address: str

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
async def predict_otc(req: PredictionRequest):
    """
    Endpoint to predict if a given wallet address belongs to an OTC broker.
    Extracts the local graph topology from Neo4j and runs it through the GNN model.
    """
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
