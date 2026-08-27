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