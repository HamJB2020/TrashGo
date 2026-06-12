# TrashGo

App de recogida de residuos a domicilio.

**Stack:** React 18 + Node.js/Express + MongoDB  
**Deploy:** Vercel (frontend) + Render (backend)

## Estructura

```
backend/
  src/
    server.js          — entry point
    config/database.js — conexión MongoDB
    models/            — Usuario, Recogida, Contacto, Auditoria
    controllers/       — auth, recogida, contacto
    middleware/auth.js — verificación JWT
    routes/            — auth, recogidas, contacto

frontend/
  src/
    App.js             — router principal
    components/        — cada pantalla y componente
    services/api.js    — cliente Axios
    tailwind.config.js — colores personalizados
```

## Stack real

Backend: Express, Mongoose, JWT, bcryptjs  
Frontend: React 18, React Router, Leaflet, Axios, Tailwind  
BD: MongoDB Atlas

## Variables de entorno

Backend: `MONGO_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`  
Frontend: `REACT_APP_API_URL`
