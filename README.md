# 🍬 Sweet Shop Management System — with AI Search & Recommendations

A full-stack **Sweet Shop** built TDD-first. Customers can browse sweets, search semantically, get AI-powered “you may also like” suggestions, add to cart, checkout, and view orders. Admins manage inventory and track orders.

> **Stack**
>
> * **Backend:** Supabase
> * **Frontend:** React + Vite + TypeScript, React Router, TanStack Query, Tailwind, Zustand
> * **AI (in the project code, not for authoring this README):** sentence-transformer embeddings for semantic search & recommendations; vector search in MongoDB (Atlas Search or custom vector fields + cosine sim). Optional OpenAI endpoint for richer product descriptions.

---

## ✨ Features

* **Auth:** Register/Login, JWT (HttpOnly cookie or Bearer), role-based guards
* **Catalog:** List, filter, semantic search (`/api/search?q=...`)
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





<img width="1848" height="820" alt="image" src="https://github.com/user-attachments/assets/09407068-188c-4341-bc85-c22de0212af7" />

<img width="1900" height="852" alt="image" src="https://github.com/user-attachments/assets/da1b22d9-2420-4eed-97f6-93571086fdf7" />

<img width="1870" height="868" alt="image" src="https://github.com/user-attachments/assets/57db1aef-fa58-4fe4-87cf-c21166b7c87d" />






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





## 🤖 My AI Usage (disclosure, if required by assignment)

I used an AI assistant **only** to help draft project documentation and boilerplate scaffolding ideas.
**All application AI features (semantic search, recommendations, tagging) are implemented in the project code itself**, using sentence-transformer embeddings and MongoDB vector search. I reviewed and tested everything locally.








