# pyrefly: ignore [missing-import]
import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
import networkx as nx
import numpy as np

class OTCDetectorGNN(torch.nn.Module):
    """
    Lightweight Graph Convolutional Network (GCN) for classifying wallet behavior.
    Classes: 0: LEGIT_USER, 1: CONSOLIDATOR, 2: SUSPECTED_OTC_BROKER
    """
    def __init__(self, num_features, hidden_channels=16, num_classes=3):
        super(OTCDetectorGNN, self).__init__()
        self.conv1 = GCNConv(num_features, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, num_classes)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.5, training=self.training)
        x = self.conv2(x, edge_index)
        return F.log_softmax(x, dim=1)

def extract_features(graph: nx.DiGraph, target_address: str):
    """
    Given a NetworkX ego-graph centered on a target address, extract structural
    and temporal features to feed into the GNN.
    
    Features:
    [in_degree, out_degree, in_out_ratio, temporal_variance, shortest_hop_to_mixer]
    """
    if target_address not in graph:
        return [0.0, 0.0, 0.0, 0.0, -1.0]

    in_deg = graph.in_degree(target_address)
    out_deg = graph.out_degree(target_address)
    ratio = in_deg / max(1, out_deg)
    
    # Calculate temporal burstiness (mocked if missing timestamps)
    timestamps = []
    for u, v, data in graph.in_edges(target_address, data=True):
        if 'timestamp' in data:
            timestamps.append(data['timestamp'])
    
    temporal_variance = np.std(timestamps) if len(timestamps) > 1 else 0.0

    # Shortest hop to mixer (dummy logic for local testing without full OFAC list)
    # In production, we'd query nx.shortest_path to any node tagged 'MIXER'
    shortest_hop = 2.0 if in_deg > 20 else -1.0 

    return [float(in_deg), float(out_deg), float(ratio), float(temporal_variance), float(shortest_hop)]

def predict_otc_risk(target_address: str, graph: nx.DiGraph) -> dict:
    """
    Extracts features and runs the mock pre-trained GNN model.
    Since we cannot train a real model in a zero-budget hackathon in real-time,
    we use the heuristic thresholds simulating the GNN output layer.
    """
    features = extract_features(graph, target_address)
    in_deg, out_deg, ratio, temp_var, mixer_hop = features
    
    # OTC Broker Footprint Logic (Simulated GNN decision boundary)
    # Hub-and-spoke: High in-degree, low out-degree to CEX, clustered time
    is_otc = False
    confidence = 0.0

    if in_deg > 50 and out_deg >= 1 and ratio > 10.0:
        if temp_var < 3600: # Clustered tightly (e.g., standard deviation < 1 hour)
            is_otc = True
            confidence = 0.95
        else:
            # Consolidation pattern, but not bursty enough to confirm OTC
            confidence = 0.60
            
    return {
        "address": target_address,
        "is_otc": is_otc,
        "confidence": confidence,
        "features": {
            "in_degree": in_deg,
            "out_degree": out_deg,
            "temporal_variance": temp_var
        }
    }
