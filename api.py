from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import asyncio
from main import get_latest_market_data, calculate_opportunity_score
from backtest import run_backtest
from scheduler import start_scheduler
from update_job import update_all

app = FastAPI(title="Market Opportunity API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    start_scheduler()
    try:
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, update_all)
        print("--- Proceso de actualización lanzado en segundo plano ---")
    except Exception as e:
        print(f"Error al lanzar la actualización en segundo plano: {e}")

def get_historical_market_data():
    try:
        connection = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="Carlos33%"
        )
        cursor = connection.cursor()
        cursor.execute("""
            SELECT date, sp500_close, sma_200, sma_125, vix 
            FROM market_data 
            ORDER BY date ASC;
        """)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        
        historical_list = []
        for row in rows:
            historical_list.append({
                "date": str(row[0]),
                "sp500": float(row[1]) if row[1] is not None else 0.0,
                "sma200": float(row[2]) if row[2] is not None else 0.0,
                "sma125": float(row[3]) if row[3] is not None else 0.0,
                "vix": float(row[4]) if row[4] is not None else 15.0
            })
        return historical_list
    except Exception as error:
        print(f"Error al leer histórico de la base de datos: {error}")
        return []

@app.get("/")
def read_root():
    return {"message": "¡API del Motor de Oportunidad de Mercado funcionando con éxito!"}

@app.get("/api/latest")
def get_latest():
    data = get_latest_market_data()
    if not data:
        raise HTTPException(status_code=404, detail="No se encontraron datos recientes.")
    
    score, allocation = calculate_opportunity_score(data)
    
    sp500 = float(data.get('sp500_close') or 0.0)
    sma_200 = float(data.get('sma_200') or 0.0)
    sma_125 = float(data.get('sma_125') or sma_200 * 0.99)
    vix = float(data.get('vix') or 15.0)
    drawdown = float(data.get('drawdown_ath') or 0.0)
    breadth = float(data.get('breadth_pct_above_200sma') or 45.0)
    
    stages = {
        "step_1_regime": bool(sp500 < sma_200),
        "step_2_panic": 0,
        "step_3_breadth": bool(breadth <= 35.0),
        "step_4_magnitude": bool(drawdown <= -10.0),
        "step_5_valuation": "Neutral / Moderado",
        "step_6_liquidity": "Expansivo"
    }
    
    return {
        "date": str(data.get('date', '')),
        "sp500_close": sp500,
        "sma_200": sma_200,
        "sma_125": sma_125,
        "drawdown_ath": drawdown,
        "vix": vix,
        "fear_greed_index": 45.0,
        "put_call_ratio": 0.75,
        "sentiment_bearish_pct": 42.13,
        "market_opportunity_score": int(score),
        "recommended_allocation": float(allocation),
        "stages": stages,
        "historical_chart": get_historical_market_data()
    }

@app.get("/api/backtest")
def get_backtest_results():
    df_results = run_backtest()
    if df_results is None or df_results.empty:
        raise HTTPException(status_code=404, detail="No se pudo generar el backtest.")
    return df_results.to_dict(orient="records")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)