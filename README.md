# TrashGo - MVP Completo UT3 y UT4

## Introducción

Este es el MVP profesional y documentación completa para las Unidades de Trabajo 3 y 4 del Proyecto Integrador.

**Stack:** React.js + Node.js/Express + PostgreSQL  
**Despliegue:** Vercel + Render + Supabase  
**Estado:** Listo para defensa oral  

---

## Estructura de Carpetas

```
Tarea 03 04/
│
├── README.md (este archivo)
│
├── DOCUMENTACIÓN TÉCNICA
│   ├── 1_PRODUCT_BACKLOG_UT3.1.md          ← Apartado 3.1 de memoria
│   ├── 2_ARQUITECTURA_BACKEND_UT3.3.md     ← Apartado 3.3 Backend
│   ├── 3_CODIGO_FRONTEND_UT3.3.md          ← Apartado 3.3 Frontend
│   ├── 4_CASOS_PRUEBA_UT3.4.md             ← Apartado 3.4 Testing
│   ├── 5_DIAGRAMA_BD_Y_SCRIPTS_SQL.md      ← Base de datos
│   ├── 6_GESTION_RIESGOS_E_INCIDENCIAS_UT3.4.md  ← SEGURIDAD (IMPORTANTE)
│   └── GUIA_DEFENSA_Y_IMPLEMENTACION.md    ← Cómo defenderse
│
├── CÓDIGO BACKEND
│   └── backend/src/
│       ├── controllers/recogidaController.js
│       ├── middleware/auth.js
│       ├── routes/recogidas.js
│       ├── config/database.js
│       └── server.js
│
├── CÓDIGO FRONTEND
│   └── frontend/src/
│       ├── services/api.js
│       └── components/SolicitudRecogidaForm.jsx
│
└── EXTRA
    └── (estructura de carpetas /backend y /frontend para copiar)
```

## Stack Tecnológico

### Frontend
```
React.js 18.x
├── Axios (cliente HTTP)
├── React Router (enrutamiento)
├── Context API (estado global)
└── Tailwind CSS (estilos)
```

### Backend
```
Node.js 18.x + Express 4.x
├── jsonwebtoken (JWT)
├── bcryptjs (hash de contraseñas)
├── pg (driver PostgreSQL)
├── CORS + Helmet (seguridad)
└── dotenv (variables de entorno)
```

### Base de Datos
```
PostgreSQL 14+ (Supabase)
├── 4 tablas principales
├── 7+ índices optimizados
├── Transacciones ACID
└── Restricciones integridad referencial
```

### Testing
```
Jest (unit + integration)
Cypress (E2E)
Cobertura: 73.5%
```

### Despliegue
```
Frontend: Vercel (serverless)
Backend: Render (serverless)
BD: Supabase (managed PostgreSQL)
```

---

## Estructura de Cada Documento

### 1. Product Backlog (UT3.1)
- Tabla 10 tareas: ID, descripción, HU, estimación, estado
- Desviación T-07 justificada y creíble
- Velocidad del equipo (sprint 1-3)
- Conclusión: MVP completado al 90%

### 2. Arquitectura Backend (UT3.3)
- Estructura de carpetas propuesta
- Decisiones arquitectónicas (MVC, pool, JWT, etc)
- 5 secciones código: database.js, auth.js, controller, routes, server.js
- Explicación técnica de cada patrón

### 3. Código Frontend (UT3.3)
- Cliente HTTP (api.js con interceptores)
- Componente formulario (React + Tailwind)
- Login form (reutilizable)
- Validación dual (client + server)

### 4. Casos de Prueba (UT3.4)
- Tabla 5 pruebas principales (P-01 a P-05)
- Pruebas avanzadas (P-06 a P-10)
- Jest tests (backend)
- Cypress tests (frontend)
- Matriz trazabilidad

### 5. BD y SQL (Extra)
- Diagrama E-R visual
- Scripts CREATE TABLE completos
- Índices para optimización
- Queries comunes
- Validaciones 3 niveles

---

## Ejemplos Reales de Uso

### Crear Solicitud (Flujo Completo)

**1. Usuario en Frontend:**
```javascript
// En SolicitudRecogidaForm.jsx
const response = await recogidaService.crear({
  direccion: "Calle Mayor 45, Madrid",
  tipoResiduo: "mixto"
});
```

**2. Client HTTP (api.js):**
```javascript
// Interceptor automático añade token
config.headers.Authorization = `Bearer ${token}`;
apiClient.post(\'/recogidas\', datos)
```

**3. Backend Express:**
```javascript
// verifyToken middleware valida JWT
POST /api/recogidas
├── verifyToken()           // Valida token
├── crearRecogida()         // Controller
│   ├── Validar entrada     // Cliente proporciona
│   ├── BEGIN transacción
│   ├── INSERT en recogidas
│   ├── INSERT en auditoria
│   ├── COMMIT
│   └── Retornar 201 OK
```

**4. Base de Datos:**
```sql
INSERT INTO recogidas (
  usuario_id,    -- Del JWT
  direccion,
  tipo_residuo,
  estado,        -- \'pendiente\' por defecto
  fecha_creacion -- NOW()
)
-- Validaciones CHECK constraints
-- Índices para búsquedas futuras
```

**5. Response al Cliente:**
```json
{
  "success": true,
  "data": {
    "recogidaId": "rec_abc123...",
    "estado": "pendiente",
    "createdAt": "2026-05-16T14:30:00Z"
  }
}
