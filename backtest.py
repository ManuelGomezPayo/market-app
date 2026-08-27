import pandas as pd
import numpy as np

def calculate_opportunity_score(score):
    """Calcula el porcentaje de asignación recomendado según el Market Opportunity Score."""
    if score >= 90:
        return 30
    elif score >= 80:
        return 25
    elif score >= 70:
        return 20
    elif score >= 60:
        return 15
    elif score >= 50:
        return 10
    else:
        return 0

def get_max_drawdown_limit(drawdown):
    """Calcula el límite máximo acumulativo de asignación permitido según el Drawdown actual."""
    if drawdown <= -40:
        return 100.0
    elif drawdown <= -30:
        return 80.0
    elif drawdown <= -25:
        return 65.0
    elif drawdown <= -20:
        return 50.0
    elif drawdown <= -15:
        return 35.0
    elif drawdown <= -10:
        return 20.0
    else:
        return 0.0

def run_backtest():
    """Ejecuta la simulación histórica aplicando las reglas estrictas de asignación sistemática."""
    print("Ejecutando backtest histórico del modelo cuantitativo...")
    
    # Rango de fechas de ejemplo para simulación (puedes conectarlo a tus datos reales de la BD)
    dates = pd.date_range(start="2022-01-01", end="2026-08-03", freq="B")
    np.random.seed(42)
    
    # Simulación de precios y caídas (Drawdown)
    sim_data = pd.DataFrame({
        "date": dates,
        "sp500_close": 4000 + np.cumsum(np.random.randn(len(dates)) * 25),
    })
    
    rolling_max = sim_data["sp500_close"].cummax()
    sim_data["drawdown"] = ((sim_data["sp500_close"] - rolling_max) / rolling_max) * 100
    
    # Simulación de puntajes cuantitativos (Score entre 30 y 95)
    sim_data["score"] = np.random.randint(30, 96, size=len(dates))
    
    allocations = []
    current_invested = 0.0
    
    for _, row in sim_data.iterrows():
        dd = row["drawdown"]
        score = row["score"]
        
        # 1. Límite máximo permitido por el Drawdown (Step 3)
        max_allowed_cum = get_max_drawdown_limit(dd)
        
        # 2. Asignación recomendada por el Score (Step 2)
        rec_alloc = calculate_opportunity_score(score)
        
        # 3. Regla Combinada (Step 4): El menor entre el límite por drawdown y el acumulado deseado
        target_total = min(max_allowed_cum, current_invested + rec_alloc)
        
        allocations.append(target_total)
        current_invested = target_total
        
    sim_data["cumulative_allocation"] = allocations
    
    print("¡Backtest completado con éxito!")
    return sim_data

if __name__ == "__main__":
    df_backtest = run_backtest()
    print("\nÚltimos resultados de la simulación:")
    print(df_backtest.tail())