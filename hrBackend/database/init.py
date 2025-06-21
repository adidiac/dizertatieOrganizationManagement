import pyodbc
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
# Citește connection string din variabila de mediu
conn_str = os.getenv("AZURE_SQL_URL")
if not conn_str:
    raise RuntimeError("AZURE_SQL_URL nu este setat")
driver_path = "/opt/homebrew/Cellar/msodbcsql18/18.5.1.1/lib/libmsodbcsql.18.dylib"

# replace driver path in connection string if it exists
if conn_str and "Driver=" in conn_str:
    conn_str = conn_str.replace("Driver={ODBC Driver 18 for SQL Server}", f"Driver={driver_path}")
else:
    conn_str = f"Driver={driver_path};{conn_str}" if conn_str else f"Driver={driver_path};"
# Conectează-te la master database (sau direct la hr, dacă există deja)
cnxn = pyodbc.connect(conn_str)
cursor = cnxn.cursor()

# Citiți fișierul SQL (adaptat la T-SQL)
with open("database.sql", "r", encoding="utf-8") as f:
    sql_script = f.read()

# Simple split pe „GO” (în T-SQL, de obicei se pune GO între batch-uri)
batches = [batch.strip() for batch in sql_script.split("GO") if batch.strip()]
for batch in batches:
    cursor.execute(batch)
    # uneori e nevoie să faci fetchall() ca să golești result set-ul
    try:
        cursor.fetchall()
    except:
        pass

cnxn.commit()
cursor.close()
cnxn.close()
