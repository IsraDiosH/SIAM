# Despliegue de Produccion FIAMUDCT

Este documento deja operativo el flujo completo:
1. Registro de participante
2. Redireccion a pasarela Mercado Pago
3. Confirmacion de pago por retorno y webhook
4. Emision de boleto QR
5. Envio de correo con QR

## 1) Dominio en Vercel

En Vercel:
- Project -> Settings -> Domains
- Agrega: fiamudct.org
- Agrega: www.fiamudct.org

Vercel te mostrara registros DNS para GoDaddy, normalmente:
- A @ -> 76.76.21.21
- CNAME www -> cname.vercel-dns.com

En GoDaddy:
- DNS -> Manage Zones -> fiamudct.org
- Crea/actualiza esos registros exactos
- Espera propagacion

## 2) Variables de entorno en Vercel (Production)

Configura en Project -> Settings -> Environment Variables:

- DATABASE_URL
- DIRECT_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL=https://fiamudct.org
- MERCADOPAGO_PUBLIC_KEY
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_WEBHOOK_SECRET
- MERCADOPAGO_WEBHOOK_URL=https://fiamudct.org/api/payments/webhook?secret=TU_SECRET
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- PUBLIC_SITE_URL=https://fiamudct.org

Notas:
- TU_SECRET en MERCADOPAGO_WEBHOOK_URL debe coincidir con MERCADOPAGO_WEBHOOK_SECRET.
- No subir .env al repositorio.

## 3) Mercado Pago (Produccion)

En Mercado Pago Developers:
- Usa credenciales APP_USR de produccion.
- Configura webhook de pagos a:
  https://fiamudct.org/api/payments/webhook?secret=TU_SECRET
- Evento requerido: payment

No mezclar cuentas/test users con credenciales de produccion.

## 4) Resend (Correo QR)

En Resend:
- Verifica dominio de envio.
- Crea remitente valido, por ejemplo: eventos@fiamudct.org
- Coloca RESEND_FROM_EMAIL con remitente verificado.

## 5) Migraciones en produccion

Despues de configurar variables, ejecutar:

npm run db:deploy

Este comando aplica las migraciones pendientes sin modificar historial.

## 6) Verificacion end-to-end

1. Ir a /registro y completar formulario
2. Confirmar redireccion a checkout Mercado Pago
3. Completar pago
4. Volver a /registro y validar mensaje de confirmacion
5. Revisar correo del participante con QR
6. Validar token QR en:
   /api/tickets/validate?token=TOKEN

## 7) Diagnostico rapido

Si falla la redireccion al checkout:
- Revisar logs de function en Vercel para /api/orders
- Confirmar MERCADOPAGO_ACCESS_TOKEN valido

Si no confirma pago:
- Revisar Webhook deliveries en Mercado Pago
- Confirmar secret y URL exacta

Si no llega correo:
- Revisar logs de Resend
- Validar RESEND_FROM_EMAIL verificado

Si falla base de datos:
- Revisar DATABASE_URL y DIRECT_URL
- Ejecutar npm run db:status y npm run db:deploy
