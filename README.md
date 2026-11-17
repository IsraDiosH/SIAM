# Sistema de Congresos

Stack base implementado:

- Astro + TypeScript
- Tailwind CSS (via plugin de Vite)
- Adapter Node para despliegue server
- Prisma ORM con PostgreSQL (Neon)
- Estructura inicial de landing publica + dashboard admin
- Carpetas de API y servicios para separar la logica de negocio

## Requisitos

- Node.js >= 22.23.4

## Scripts

- npm run dev
- npm run build
- npm run preview
- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:studio

## Estructura principal

- prisma/schema.prisma
- prisma.config.ts
- src/layouts/MainLayout.astro
- src/layouts/AdminLayout.astro
- src/pages (landing y dashboard)
- src/pages/api (auth, orders, payments, tickets, attendees, check-in)
- src/lib (prisma, auth, mercadopago, email, qr)
- src/services (event, order, payment, ticket, check-in)

## Primer arranque

1. Ajustar variables en .env.
2. Ejecutar npm run prisma:generate.
3. Ejecutar npm run prisma:migrate.
4. Ejecutar npm run dev.

## Nota importante

El entorno actual debe usar Node 22.23.4 o superior. Con versiones inferiores Astro 7 puede mostrar errores de compatibilidad.

# placeholder
