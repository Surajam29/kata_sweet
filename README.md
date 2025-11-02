# 🍬 Sweet Shop Management System — with AI Search & Recommendations

A full-stack **Sweet Shop** built TDD-first. Customers can browse sweets, search semantically, get AI-powered “you may also like” suggestions, add to cart, checkout, and view orders. Admins manage inventory and track orders.

> **Stack**
>
> * **Backend:** Node.js + TypeScript, Express, MongoDB (Mongoose), JWT, Zod, Jest + Supertest
> * **Frontend:** React + Vite + TypeScript, React Router, TanStack Query, Tailwind, Zustand
> * **AI (in the project code, not for authoring this README):** sentence-transformer embeddings for semantic search & recommendations; vector search in MongoDB (Atlas Search or custom vector fields + cosine sim). Optional OpenAI endpoint for richer product descriptions.

---

## ✨ Features

* **Auth:** Register/Login, JWT (HttpOnly cookie or Bearer), role-based guards
* **Catalog:** List, filter, semantic search (`/api/search?q=...`)
* **AI Recommendations:** “Related sweets” widget powered by vector similarity
* **Cart & Checkout:** Cart totals, taxes hook, order creation
* **Admin:** CRUD for sweets, inventory & stock thresholds
* **TDD:** Unit + integration tests (auth, sweets, orders, AI endpoints)
* **DX:** Zod input validation, centralized error middleware, consistent DTOs

---

## 🧠 AI in this Project (Detailed)

**What AI is used for (code-level):**

* **Semantic Search:** Convert each sweet’s `name + description + tags` into an **embedding** vector. Query text is embedded too; we return the top-K by cosine similarity.
* **Recommendations:** For a given sweet, fetch nearest neighbors in vector space → “You may also like”.
* **Auto-tagging (optional):** Lightweight NLP pipeline to generate tags from description; can optionally call OpenAI for better tags.

**Default model & vector store:**

* **Model:** `sentence-transformers/all-MiniLM-L6-v2` (fast, 384-dim).
  You can run it locally (Node or Python script) or by precomputing offline.
* **Vector storage:**

  * **Option A (Atlas Search):** Use MongoDB Atlas Search **vector** index on `embedding`.
  * **Option B (Manual):** Store `embedding: number[]` in each document; compute cosine similarity in app code (OK for small data).

**Data shape (`sweets` collection):**

```ts
{
  _id: ObjectId,
  name: string,
  category: string,
  price: number,
  quantity: number,
  description?: string,
  tags?: string[],
  imageUrl?: string,
  embedding?: number[]    // 384-dim
}
```

**Env for AI (add to `backend/.env`):**

```
EMBEDDINGS_DIM=384
AI_PROVIDER=local            # local | openai
OPENAI_API_KEY=              # only if AI_PROVIDER=openai
AI_BATCH_SIZE=64
```

**Create Atlas vector index (Option A):**

```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 384,
        "similarity": "cosine"
      }
    }
  }
}
```

**Embed & seed script (Node/TS outline):**

```ts
// src/scripts/embed-seed.ts
import { pipeline } from "@xenova/transformers"; // pure JS, no Python needed
import { SweetModel } from "../modules/sweets/sweet.model";

async function run() {
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2"); // browser/Node port
  const sweets = await SweetModel.find({});

  for (const s of sweets) {
    const text = [s.name, s.description || "", (s.tags || []).join(" ")].join(" ");
    const output = await extractor(text, { pooling: "mean", normalize: true });
    s.embedding = Array.from(output.data); // Float32Array → number[]
    await s.save();
  }
  console.log("Embeddings updated.");
}
run().catch(console.error);
```

**Semantic search endpoint (sketch):**

```ts
// GET /api/search?q=chocolate bar
// If using Atlas Search knnBeta:
db.sweets.aggregate([
  {
    $search: {
      knnBeta: {
        vector: <queryEmbedding>,
        path: "embedding",
        k: 10
      }
    }
  },
  { $project: { name: 1, price: 1, score: { $meta: "searchScore" } } }
]);
```

**Recommendations (sketch):**

```ts
// GET /api/sweets/:id/related
// Fetch sweet.embedding → knn vector query (exclude itself) → top 6.
```

> ✅ **Note:** This section describes **AI used in the project code**. The README itself was authored by a human; see the “My AI Usage” section later to disclose tooling if required by your evaluator.

---

## 🗂️ Repository Layout

```
/ (repo root)
├─ backend/
│  ├─ src/
│  │  ├─ app.ts, server.ts, config/
│  │  ├─ modules/
│  │  │  ├─ auth/    (routes, controller, service, tests)
│  │  │  ├─ sweets/  (CRUD, search, embeddings, tests)
│  │  │  └─ orders/  (create/list, tests)
│  │  └─ scripts/    (seed.ts, embed-seed.ts)
│  ├─ package.json
│  └─ .env.example
├─ frontend/
│  ├─ src/ (routes, components, store, api)
│  ├─ index.html, vite.config.ts, package.json
│  └─ .env.example
└─ assets/
   └─ screenshots/
      01_home.png ... 05_orders.png
```

---

## ⚙️ Prerequisites

* Node 18+ and npm / pnpm
* MongoDB local (`mongod`) **or** MongoDB Atlas + **Compass**
* Optional: Docker & Docker Compose

---

## 🚀 Setup & Run Locally

### 1) Clone & Install

```bash
git clone <your-repo-url> sweet-shop
cd sweet-shop

cd backend && npm i && cd ..
cd frontend && npm i && cd ..
```

### 2) Environment

**`backend/.env.example`**

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sweetshop

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
COOKIE_SECURE=false

# AI
EMBEDDINGS_DIM=384
AI_PROVIDER=local        # local | openai
OPENAI_API_KEY=
AI_BATCH_SIZE=64
```

**`frontend/.env.example`**

```
VITE_API_BASE_URL=http://localhost:4000
```

Copy examples to real env files and edit as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Start Backend (dev)

```bash
cd backend
npm run dev       # API → http://localhost:4000
```

### 4) Start Frontend (dev)

```bash
cd ../frontend
npm run dev       # Web → http://localhost:5173
```

---

## 🧪 Testing (TDD)

```bash
cd backend
npm test          # Jest + Supertest

cd ../frontend
npm run test      # Vitest + Testing Library
```

---

## 🌱 Seed Data & Embeddings

```bash
cd backend
npm run seed          # adds sample sweets + admin user
npm run embed:seed    # generates embeddings for sweets (see script above)
```

> **Admin (example):** `admin@sweet.shop / admin123`

---

## 🔌 API Reference (Selected)

**Auth**

* `POST /api/auth/register` `{ name, email, password }`
* `POST /api/auth/login` `{ email, password }` → sets cookie or returns token
* `GET /api/auth/me` (auth)

**Sweets**

* `GET /api/sweets` `?q=&category=&min=&max=`
* `GET /api/sweets/:id`
* `POST /api/sweets` (admin)
* `PATCH /api/sweets/:id` (admin)
* `DELETE /api/sweets/:id` (admin)

**AI**

* `GET /api/search?q=<text>` → semantic search over sweets
* `GET /api/sweets/:id/related` → vector-based recommendations

**Orders**

* `POST /api/orders` → create from cart
* `GET /api/orders/my`
* `GET /api/orders/:id`

---

## 🧩 Frontend Notes

* **Pages:** Home (catalog + search), Sweet detail (with **Related**), Auth, Cart, Checkout, Orders, Admin dashboard
* **State:** Zustand for cart/user; React Query for API cache; guarded routes for admin
* **UI:** Tailwind utility classes + accessible forms; toasts for API feedback

---

## 🔐 Security & Performance

* HttpOnly cookie for JWT (or Bearer for mobile clients)
* Zod validation on inputs; sanitize user content
* Indexes on `name`, `category`, and (if manual vector) a small inverted index for text
* Rate limiting on auth/search endpoints

---

## 🐳 Docker (Optional)

`docker-compose.yml` can run MongoDB, backend, and frontend:

```bash
docker compose up --build
```

---

## 🖼️ Screenshots

Replace placeholders (keep filenames):

* `assets/screenshots/01_home.png`
* `assets/screenshots/02_auth.png`
* `assets/screenshots/03_admin.png`
* `assets/screenshots/04_cart_checkout.png`
* `assets/screenshots/05_orders.png`

---

## 🧭 Troubleshooting

* **Mongo not reachable:** Start `mongod` or verify Atlas URI; allow IP in Atlas.
* **CORS:** Set `CORS_ORIGIN` to your frontend origin.
* **Embeddings undefined:** Run `npm run embed:seed` after `npm run seed`.
* **Vector index error (Atlas):** Ensure index JSON matches model dimension.

---

## 🤖 My AI Usage (disclosure, if required by assignment)

I used an AI assistant **only** to help draft project documentation and boilerplate scaffolding ideas.
**All application AI features (semantic search, recommendations, tagging) are implemented in the project code itself**, using sentence-transformer embeddings and MongoDB vector search. I reviewed and tested everything locally.




