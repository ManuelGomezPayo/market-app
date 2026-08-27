# Market App

Aplicación Full-Stack de análisis y monitorización automatizada de datos de mercado. El sistema procesa métricas financieras (como el S&P 500 y el VIX) para calcular puntuaciones de oportunidad (*opportunity scores*) mediante un sistema de reglas y métricas cuantitativas. Los datos del sp500 y vix se actualizan automáticamente al incializarlo, los demas se tienen que insertar manualmente.

##  Tecnologías

* Python
* FastAPI
* PostgreSQL
* Next.js
* TypeScript

##  Funcionalidades

- Actualización automática de datos del S&P 500 y VIX al iniciar la aplicación.
- Procesamiento de métricas de mercado.
- Cálculo de opportunity scores.
- Análisis del S&P 500 y VIX.
- Visualización de métricas mediante el frontend.

##  Flujo de Datos

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
    Next.js
       ↓
Interfaz visual