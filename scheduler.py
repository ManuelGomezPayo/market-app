from apscheduler.schedulers.background import BackgroundScheduler
from update_job import update_all

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Programa la ejecución automática todos los días a las 22:00 hrs
    scheduler.add_job(update_all, 'cron', hour=22, minute=0)
    scheduler.start()
    print("Planificador automático (APScheduler) configurado e iniciado correctamente.")