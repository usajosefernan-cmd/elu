# 🚀 Guía de Exportación: LuxScaler v27 "Standalone"

¡Sí! Puedes sacar esta app de Emergent y ejecutarla en cualquier lugar (Tu PC, AWS, DigitalOcean, etc.). He preparado todo para que sea **"Plug & Play"**.

## Opción A: Docker (Recomendada - Más fácil)
Esta opción levanta toda la app (Frontend + Backend + Base de Datos) con un solo comando.

### 1. Requisitos
- Tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.
- Tu código fuente (descárgalo vía GitHub).

### 2. Configuración
Crea un archivo `.env` en la raíz del proyecto (junto a `docker-compose.yml`) con tus claves:
```env
GOOGLE_API_KEY=tu_clave_1
GOOGLE_API_KEY_2=tu_clave_2
GOOGLE_API_KEY_3=tu_clave_3
```

### 3. Ejecutar
Abre una terminal en la carpeta del proyecto y corre:
```bash
docker-compose up --build
```

¡Listo!
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/api

---

## Opción B: Ejecución Manual (Sin Docker)

### 1. Backend (Python)
```bash
cd backend
pip install -r requirements.txt
# Asegúrate de tener MongoDB corriendo localmente
export MONGO_URL="mongodb://localhost:27017"
export GOOGLE_API_KEY="tu_clave"
uvicorn server:app --reload --port 8001
```

### 2. Frontend (React)
```bash
cd frontend
yarn install
# Edita frontend/.env para que apunte a tu backend local
# REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

## Estructura del Código
El código es **Estándar**:
- **Backend:** Python FastAPI (Framework moderno y veloz).
- **Frontend:** React 19 + TailwindCSS.
- **DB:** MongoDB (Base de datos NoSQL estándar).

No hay "magia propietaria" que te impida llevártelo. ¡Es todo tuyo!
