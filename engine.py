def calculate_opportunity_score(data):
    """
    Calcula el Market Opportunity Score (0-100) y la asignación sugerida
    según las reglas de régimen, magnitud y drawdown.
    """
    sp500 = data.get('sp500_close', 0)
    sma_200 = data.get('sma_200', 0)
    sma_125 = data.get('sma_125', sp500) # O el valor real que guardes
    vix = data.get('vix', 0)
    drawdown_ath = data.get('drawdown_ath', 0) # Ejemplo: -12.5 (%)
    
    score = 0
    
    # --- Step 1: Regime (Ejemplo de evaluación) ---
    is_below_200 = sp500 < sma_200
    is_below_125 = sp500 < sma_125
    if is_below_200:
        score += 20
    if is_below_125:
        score += 15
        
    # --- Step 2 & 4: Panic & Magnitude ---
    if vix >= 27.5:
        score += 25
    if drawdown_ath <= -10:
        score += 20
    if drawdown_ath <= -20:
        score += 20
        
    # Limitar el score máximo a 100
    score = min(max(score, 0), 100)
    
    # --- Capital Deployment Methodology (Step 2: Score Allocation) ---
    if score >= 90:
        score_allocation = 30
    elif score >= 80:
        score_allocation = 25
    elif score >= 70:
        score_allocation = 20
    elif score >= 60:
        score_allocation = 15
    elif score >= 50:
        score_allocation = 10
    else:
        score_allocation = 0
        
    # --- Step 3: Drawdown Limit (Risk Control Mechanism) ---
    # Drawdown must be expressed as a positive or negative threshold check
    dd = abs(drawdown_ath)
    if dd >= 40:
        max_dd_allocation = 100
    elif dd >= 30:
        max_dd_allocation = 80
    elif dd >= 25:
        max_dd_allocation = 65
    elif dd >= 20:
        max_dd_allocation = 50
    elif dd >= 15:
        max_dd_allocation = 35
    elif dd >= 10:
        max_dd_allocation = 20
    else:
        max_dd_allocation = 0
        
    # --- Step 4: Combination Rule (The lower of the two values) ---
    recommended_allocation = min(score_allocation, max_dd_allocation)
    
    return score, recommended_allocation