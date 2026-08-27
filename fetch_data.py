import yfinance as yf
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "Carlos33%",
    "host": "localhost",
    "port": "5432"
}

def save_to_database(df):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("Sincronizando datos con PostgreSQL...")
        
        values = []
        for _, row in df.iterrows():
            values.append((
                row['date'],
                float(row['sp500_close']),
                float(row['vix']),
                float(row['sp500_sma_200']),
                float(row['sp500_sma_125']),
                float(row['sp500_ath_drawdown']),
                19.5, 26.0, 0.0, 45.0
            ))
            
        query = """
            INSERT INTO market_data (
                date, sp500_close, vix, sma_200, sma_125, drawdown_ath, 
                pe_ratio, cape_ratio, fed_liquidity_score, breadth_pct_above_200sma
            ) VALUES %s
            ON CONFLICT (date) DO UPDATE SET
                sp500_close = EXCLUDED.sp500_close,
                vix = EXCLUDED.vix,
                sma_200 = EXCLUDED.sma_200,
                sma_125 = EXCLUDED.sma_125,
                drawdown_ath = EXCLUDED.drawdown_ath;
        """
        
        execute_values(cursor, query, values)
        conn.commit()
        cursor.close()
        conn.close()
        print("¡Datos de mercado guardados y sincronizados con éxito en PostgreSQL!")
    except Exception as e:
        print(f"Error al guardar en la base de datos: {e}")

def download_market_data():
    print("Descargando datos de Yahoo Finance...")
    
    sp500 = yf.download("^GSPC", period="max", interval="1d", progress=False)
    vix = yf.download("^VIX", period="max", interval="1d", progress=False)
    
    if sp500.empty or vix.empty:
        print("Error: No se pudieron descargar los datos de Yahoo Finance.")
        return None
        
    sp500.index = pd.to_datetime(sp500.index).tz_localize(None)
    vix.index = pd.to_datetime(vix.index).tz_localize(None)
    
    sp500_close = sp500['Close'].iloc[:, 0] if isinstance(sp500['Close'], pd.DataFrame) else sp500['Close']
    vix_close = vix['Close'].iloc[:, 0] if isinstance(vix['Close'], pd.DataFrame) else vix['Close']
    
    df = pd.DataFrame({
        'sp500_close': sp500_close,
        'vix': vix_close
    }).dropna()
    
    df['sp500_sma_125'] = df['sp500_close'].rolling(window=125).mean()
    df['sp500_sma_200'] = df['sp500_close'].rolling(window=200).mean()
    
    rolling_max = df['sp500_close'].cummax()
    df['sp500_ath_drawdown'] = ((df['sp500_close'] - rolling_max) / rolling_max) * 100
    
    df = df.dropna(subset=['sp500_sma_200', 'sp500_sma_125'])
    
    today = pd.Timestamp(datetime.now().date())
    df = df[df.index <= today]
    
    df['date'] = df.index.strftime('%Y-%m-%d')
    
    save_to_database(df)
    return df

if __name__ == "__main__":
    download_market_data()