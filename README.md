# CryptoTrace: Blockchain Fraud Analytics

**CryptoTrace** is an advanced, real-time blockchain tracing and analytics platform. Built for the SIH / MHA problem statement, it automatically traces the flow of illicit funds from a reported suspect wallet to known centralized exchange (CEX) cash-out points, using Neo4j graph databases and Python-powered Graph Neural Networks (GNNs) for risk scoring.

---

## 📌 Prerequisites

Before running the project locally, ensure you have the following installed:
- **Node.js** (v20+ recommended)
- **Python** (v3.10+ recommended)
- **Neo4j Desktop** (or a cloud instance via Neo4j Aura)
- **Alchemy API Key** (Free tier is fine, used for on-chain data ingestion)
- **Google Gemini API Key** (For AI Copilot case briefs)

---

## 🚀 Installation & Setup

If you have just cloned or downloaded this repository, follow these steps sequentially:

### 1. Install Dependencies
Open your terminal and install the dependencies for all three layers of the stack.

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd ../backend
npm install
```

**Machine Learning (Python):**
```bash
cd ../ml
pip install -r requirements.txt
```
*(Note: It is highly recommended to use a virtual environment like `python -m venv venv` and activate it before installing python packages).*

### 2. Configure Environment Variables

You need to set up environment variables for both the backend and frontend.

**Backend (`backend/.env`):**
Create a `.env` file in the `backend/` directory (you can copy `.env.example` if it exists) and add the following:

```env
PORT=4001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# --- Blockchain RPC ---
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_NETWORK=eth-mainnet
MULTI_CHAIN_ENABLED=true

# --- Traversal Tuning ---
RPC_CONCURRENCY=2
MAX_FANOUT_PER_ADDRESS=8

# --- Neo4j Graph Database ---
GRAPH_ENABLED=true
NEO4J_URI=neo4j://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password_here
NEO4J_DATABASE=neo4j

# --- AI Narrative ---
GEMINI_API_KEY=your_gemini_api_key_here
INTERNAL_API_KEY=local-dev-key-12345
```

**Frontend (`frontend/.env`):**
Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:4001
VITE_INTERNAL_API_KEY=local-dev-key-12345
```

### 3. Start Neo4j & Redis (via Docker or Desktop)
You can run the required databases using Docker or install them locally.

**Option A: Using Docker (Recommended)**
Open a new terminal and run these commands to start Neo4j and Redis:
```bash
# Start Neo4j
docker run --name cryptotrace-neo4j -p 7474:7474 -p 7687:7687 -d -e NEO4J_AUTH=neo4j/your_neo4j_password_here neo4j:latest

# Start Redis (for real-time websocket alerts)
docker run --name cryptotrace-redis -p 6379:6379 -d redis:latest
```
*(Make sure to update `your_neo4j_password_here` to match the password in your `backend/.env` file).*

**Option B: Using Desktop Apps**
1. Open **Neo4j Desktop** and start your local DBMS (ensure the password matches your `backend/.env`).
2. Run a local Redis server if you want real-time alerts.

### 4. Seed the Database
Before the system can trace funds to an exchange, it needs to know what the exchange addresses are. Run the seeder script from the `backend` folder:
```bash
cd backend
npm run seed:exchanges
```
*(This will inject known Binance, OKX, Kraken, etc. hot wallets into your Neo4j graph).*

---

## 🏃‍♂️ Running the Application

To run the full stack, you will need **3 separate terminal windows**:

**Terminal 1: Start the Python ML Engine**
```bash
cd ml
uvicorn main:app --reload --port 8000
```

**Terminal 2: Start the Node.js Backend**
```bash
cd backend
npm run dev
```

**Terminal 3: Start the React Frontend**
```bash
cd frontend
npm run dev
```

Once all three are running, open your browser and navigate to: **`http://localhost:5173`**

---

## 🧪 Testing the System

You can test the system by entering known exploiter addresses into the "Active Case Intake" sidebar. 

**Recommended Test Cases:**
1. **Euler Finance Exploiter (Tornado Cash Mixer):**
   `0xb66cd966670d962c227b3eaba30a872dbfb995db`
   *Demonstrates massive ETH laundering through Tornado Cash.*
   
2. **Ronin/Axie Infinity Exploiter (Cross-Chain & Peeling):**
   `0x098B716B8Aaf21512996dC57EB0615e2383E2f96`
   *Demonstrates high-volume fan-out and peeling chains leading to Binance/Huobi.*

**Tips for Demoing:**
- If the trace takes too long, reduce the **Max Hops** slider to `3` or `4`.
- If you hit rate limits (429 Too Many Requests), ensure `RPC_CONCURRENCY=2` in your `backend/.env` file.
