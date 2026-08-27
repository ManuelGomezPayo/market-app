from fetch_data import download_market_data

def update_all():
    print("Ejecutando tarea de actualización automática...")
    download_market_data()
    print("Actualización completada con éxito.")

if __name__ == "__main__":
    update_all()