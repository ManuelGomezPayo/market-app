# Market App

Aplicación Full-Stack de análisis y monitorización automatizada de datos de mercado. El sistema procesa métricas financieras, como el S&P 500 y el VIX, para calcular puntuaciones de oportunidad (*opportunity scores*) mediante un sistema de reglas.

Los datos del S&P 500 y del VIX se actualizan automáticamente al iniciar la aplicación; el resto de datos se introducen manualmente.

## Tecnologías

- Python
- FastAPI
- PostgreSQL
- Next.js
- TypeScript

## Funcionalidades

- Actualización automática de datos del S&P 500 y del VIX al iniciar la aplicación.
- Procesamiento de métricas de mercado.
- Cálculo de *opportunity scores*.
- Análisis del S&P 500 y del VIX.
- Visualización de métricas mediante el frontend.

## Flujo de Datos

```text
Datos financieros
       ↓
fetch_data.py
       ↓
PostgreSQL
       ↓
engine.py
       ↓
Opportunity Score
       ↓
FastAPI
       ↓
Next.js
       ↓
Interfaz visual
```

## Cómo inicializar la aplicación

### Requisitos previos

Asegúrate de tener instalado en tu sistema:

- Python
- Node.js
- PostgreSQL

### 1. Configurar la base de datos

Abre tu terminal de PostgreSQL (o tu gestor habitual) y conéctate al servidor.

Crea una base de datos nueva para el proyecto, por ejemplo:

```sql
CREATE DATABASE market_db;
```

Asegúrate de configurar las credenciales de conexión (usuario, contraseña, host y puerto) en tu proyecto de Python para que la aplicación pueda conectarse a esta base de datos.

### 2. Arrancar el Backend (FastAPI)

Instala las dependencias de Python:

```bash
pip install -r requirements.txt
```

Inicia el servidor de FastAPI con Uvicorn:

```bash
uvicorn api:app --reload
```

### 3. Arrancar el Frontend (Next.js)

Entra en la carpeta del frontend:

```bash
cd frontend
```

Instala las dependencias de Node:

```bash
npm install
```

Arranca el entorno de desarrollo:

```bash
npm run dev
```

El frontend estará disponible en:

http://localhost:3000