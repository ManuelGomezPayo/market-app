import psycopg2

def get_latest_market_data():
    try:
        connection = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="Carlos33%"
        )
        cursor = connection.cursor()
        cursor.execute("""
            SELECT date, sp500_close, vix, sma_200, sma_125, drawdown_ath, 
                   pe_ratio, cape_ratio, fed_liquidity_score, breadth_pct_above_200sma
            FROM market_data 
            ORDER BY date DESC 
            LIMIT 1;
        """)
        row = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if not row:
            return None
            
        return {
            "date": str(row[0]),
            "sp500_close": float(row[1]) if row[1] is not None else 0.0,
            "vix": float(row[2]) if row[2] is not None else 15.0,
            "sma_200": float(row[3]) if row[3] is not None else 0.0,
            "sma_125": float(row[4]) if row[4] is not None else 0.0,
            "drawdown_ath": float(row[5]) if row[5] is not None else 0.0,
            "pe_ratio": float(row[6]) if row[6] is not None else 19.5,
            "cape_ratio": float(row[7]) if row[7] is not None else 26.0,
            "fed_liquidity_score": float(row[8]) if row[8] is not None else 0.0,
            "breadth_pct_above_200sma": float(row[9]) if row[9] is not None else 45.0
        }
    except Exception as e:
        print(f"Error en get_latest_market_data: {e}")
        return None

def calculate_opportunity_score(data):
    try:
        sp500 = data.get('sp500_close', 0.0)
        sma_200 = data.get('sma_200', 0.0)
        vix = data.get('vix', 15.0)
        drawdown = data.get('drawdown_ath', 0.0)
        breadth = data.get('breadth_pct_above_200sma', 45.0)

        score = 0
        if sp500 < sma_200: score += 25
        if vix >= 27.5: score += 25
        if breadth <= 35.0: score += 25
        if drawdown <= -10.0: score += 25

        return int(score), float(score)
    except Exception as e:
        print(f"Error en calculate_opportunity_score: {e}")
        return 0, 0.0