# Solee — Production-Grade E-Commerce Platform

## What Is Solee?

Solee is a scalable, microservices-based e-commerce platform targeting Pakistan and international markets. Initially selling women's clothing, but architected to support any category and evolve into a full multi-vendor marketplace (like Daraz/Amazon).

---

## Architecture Decision: REST vs GraphQL

**Decision: REST for internal service communication, GraphQL for the client-facing API Gateway.**

Why:
- Internal microservices talk to each other via REST (simple, fast, easy to debug)
- The API Gateway exposes a **GraphQL API** to the frontend (reduces over-fetching, flexible queries, great for product catalogs with complex filtering)
- Some public REST endpoints are kept for webhooks, payments (Stripe/JazzCash callbacks), and mobile-friendly simple endpoints

This is the same pattern used by **Shopify, GitHub, and Twitter**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| API Layer | GraphQL (Apollo Server) + REST |
| Database | MongoDB (Mongoose ODM) |
| Cache | Redis |
| Message Broker | RabbitMQ (async tasks: emails, notifications) |
| Auth | JWT + Google OAuth (Passport.js) |
| Payments | Stripe + JazzCash + COD |
| File Storage | Cloudinary (product images) |
| Search | MongoDB Atlas Search (later Elasticsearch) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Winston (logs) + Prometheus + Grafana |
| Testing | Jest + Supertest (unit/integration) |

---

## Microservices Breakdown

```
solee_backend/
├── api-gateway/          # Entry point — GraphQL + REST proxy, auth middleware, rate limiting
├── user-service/         # Auth (JWT, Google OAuth), profiles, roles, wishlist
├── product-service/      # Products, categories, variations, inventory, search
├── order-service/        # Orders, order tracking, order history
├── cart-service/         # Shopping cart (Redis-backed for speed)
├── payment-service/      # Stripe, JazzCash, COD processing
├── notification-service/ # Emails (Nodemailer), SMS, push notifications via queue
├── vendor-service/       # Multi-vendor shops, vendor onboarding, approval
├── admin-service/        # CMS, banners, landing pages, analytics, full control panel
└── shared/               # Shared utilities, error classes, base models, constants
```

Each service:
- Has its **own MongoDB database** (database-per-service pattern)
- Runs on its **own port** in development
- Is **independently deployable** via Docker
- Communicates via:
  - **Synchronous**: REST HTTP calls (for reads that need immediate response)
  - **Asynchronous**: RabbitMQ events (for things like "order placed → send email")

---

## Folder Structure (Per Service)

```
user-service/
├── src/
│   ├── config/           # DB connection, env vars, passport config
│   ├── controllers/      # Route handlers (thin layer, calls services)
│   ├── services/         # Business logic (SOLID: single responsibility)
│   ├── repositories/     # Database queries (abstracts Mongoose)
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express router definitions
│   ├── middlewares/      # Auth, validation, error handling
│   ├── validators/       # Joi/Zod input validation schemas
│   ├── events/           # RabbitMQ event publishers/subscribers
│   ├── graphql/          # GraphQL typedefs + resolvers (if service exposes GraphQL)
│   │   ├── typedefs/
│   │   └── resolvers/
│   └── utils/            # Helpers, logger, response formatter
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── .env.example
└── package.json
```

---

## Database Schema (MongoDB Collections)

### user-service DB
```
users: { _id, email, password(hashed), googleId, role(user/vendor/admin),
         profile: { name, phone, avatar }, addresses: [], isVerified, createdAt }

wishlists: { _id, userId, productId, addedAt }
```

### product-service DB
```
categories: { _id, name, slug, parentId(null=root), image, isActive, order,
              seoTitle, seoDescription }

products: { _id, vendorId, categoryId, name, slug, description,
            images: [], price, comparePrice, sku,
            variations: [{ type: 'size'|'color', options: [] }],
            stock, isActive, tags, seoTitle, seoDescription, createdAt }

inventory: { _id, productId, variationKey, stock, reservedStock, updatedAt }
```

### order-service DB
```
orders: { _id, userId, vendorId, items: [{ productId, variationKey, qty, price }],
          subtotal, discount, tax, shippingCost, total,
          status: 'pending'|'confirmed'|'shipped'|'delivered'|'cancelled',
          shippingAddress, paymentMethod, paymentStatus, trackingNumber, createdAt }
```

### cart-service DB (Redis)
```
cart:{userId} → Hash { productId:variationKey → { qty, price, name, image } }
TTL: 7 days
```

### payment-service DB
```
transactions: { _id, orderId, userId, method: 'stripe'|'jazzcash'|'cod',
                amount, currency, status: 'pending'|'success'|'failed'|'refunded',
                gatewayTransactionId, metadata, createdAt }
```

### vendor-service DB
```
vendors: { _id, userId, shopName, slug, logo, banner, description,
           status: 'pending'|'approved'|'suspended',
           commissionRate, bankDetails, createdAt }
```

### admin-service DB
```
banners: { _id, title, image, link, position: 'homepage'|'category', isActive, order }

landing_pages: { _id, slug, sections: [{ type, config, order }], isPublished }

cms_blocks: { _id, key, content, type: 'html'|'json' }
```

---

## API Structure

### REST Endpoints (via API Gateway)

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/google
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout

GET    /api/v1/products?category=&search=&page=&limit=
GET    /api/v1/products/:slug
GET    /api/v1/categories

POST   /api/v1/cart/add
GET    /api/v1/cart
DELETE /api/v1/cart/:itemId

POST   /api/v1/orders
GET    /api/v1/orders/:id

POST   /api/v1/payments/stripe/intent
POST   /api/v1/payments/jazzcash
POST   /api/v1/payments/webhook/stripe   # Stripe webhook (no auth)

# Admin
GET    /api/v1/admin/orders
PUT    /api/v1/admin/products/:id
POST   /api/v1/admin/banners
```

### GraphQL Schema (API Gateway)

```graphql
type Query {
  me: User
  product(slug: String!): Product
  products(filter: ProductFilter, page: Int, limit: Int): ProductConnection
  categories: [Category]
  myOrders: [Order]
  cart: Cart
  vendor(slug: String!): Vendor
}

type Mutation {
  register(input: RegisterInput!): AuthPayload
  login(input: LoginInput!): AuthPayload
  addToCart(productId: ID!, variationKey: String, qty: Int!): Cart
  placeOrder(input: OrderInput!): Order
  addToWishlist(productId: ID!): Boolean
}

type Subscription {
  orderStatusChanged(orderId: ID!): Order  # real-time tracking
}
```

---

## Authentication Flow

```
1. User registers with email/password → password hashed with bcrypt
   OR
   User clicks "Login with Google" → Passport.js Google OAuth2 → get/create user

2. On login → issue:
   - Access Token (JWT, 15min expiry)
   - Refresh Token (JWT, 7 days, stored in httpOnly cookie)

3. Every request → API Gateway verifies Access Token
   If expired → frontend uses /auth/refresh-token to get new one

4. Roles: user | vendor | admin
   Middleware checks role before allowing access to protected routes
```

---

## Event-Driven Flow (RabbitMQ)

```
Order Placed
    └─ order-service publishes → "order.created" event
            ├─ notification-service subscribes → sends confirmation email
            ├─ payment-service subscribes → initiates payment if needed
            └─ inventory-service subscribes → reserves stock

Payment Success
    └─ payment-service publishes → "payment.success"
            ├─ order-service → updates order status to "confirmed"
            └─ notification-service → sends payment receipt email

Order Shipped
    └─ order-service publishes → "order.shipped"
            └─ notification-service → sends tracking email/SMS
```

---

## DevOps Setup

### Docker Compose (Development)
```yaml
services:
  api-gateway, user-service, product-service, order-service,
  cart-service, payment-service, notification-service, vendor-service,
  admin-service,
  mongodb, redis, rabbitmq
```

### GitHub Actions CI/CD
```
On push to main:
  1. Run tests (Jest)
  2. Build Docker images
  3. Push to Docker Hub / GitHub Container Registry
  4. Deploy to VPS/Cloud (via SSH or Kubernetes)
```

---

## Security

- Helmet.js (HTTP security headers)
- Rate limiting (express-rate-limit + Redis store)
- Input validation (Zod on every endpoint)
- SQL/NoSQL injection prevention (Mongoose sanitize)
- CORS configured per environment
- JWT secrets in environment variables (never in code)
- Webhook signature verification (Stripe)
- HTTPS enforced in production

---

## Scaling Strategy

```
Phase 1 (Launch):
  - Single VPS, Docker Compose, MongoDB Atlas, Cloudinary

Phase 2 (Growth):
  - Separate VPS per heavy service (product, order)
  - Redis cluster for cart
  - CDN for images (Cloudflare)
  - Load balancer (Nginx)

Phase 3 (Scale):
  - Kubernetes (K8s) cluster
  - Horizontal pod autoscaling
  - MongoDB sharding
  - Elasticsearch for product search
  - Multiple regions
```

---

## Development Steps (Build Order)

```
Step 1:  Project scaffolding + Docker Compose + shared utilities
Step 2:  User Service — register, login, JWT, Google OAuth
Step 3:  Product Service — categories, products CRUD, search
Step 4:  Cart Service — Redis-backed cart
Step 5:  Order Service — place order, order history
Step 6:  Payment Service — COD first, then Stripe, then JazzCash
Step 7:  Notification Service — email via queue
Step 8:  API Gateway — GraphQL schema stitching + REST proxy
Step 9:  Vendor Service — shop creation, admin approval
Step 10: Admin Service — CMS, banners, analytics
Step 11: Testing — unit + integration tests for all services
Step 12: DevOps — CI/CD, monitoring, production deployment
```

---

## Environment Variables (per service)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/solee_users
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
CLOUDINARY_URL=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

---

## Packages Reference (Key ones)

```
Core:         express, mongoose, dotenv, cors, helmet
Auth:         jsonwebtoken, bcryptjs, passport, passport-google-oauth20
Validation:   zod
GraphQL:      @apollo/server, graphql, @graphql-tools/schema
Cache:        ioredis
Queue:        amqplib (RabbitMQ client)
Payments:     stripe
Upload:       multer, cloudinary
Logging:      winston, morgan
Testing:      jest, supertest
Dev tools:    nodemon, typescript (optional but recommended)
```

---

*Last updated: 2026-03-28*
*Status: In Development — Step 1 (Scaffolding)*
