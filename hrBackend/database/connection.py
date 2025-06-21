# database/connector_sqlserver.py

import os
import pyodbc

class DatabaseConnectorSQLServer:
    """
    Un conector simplu pentru Azure SQL Database (SQL Server).
    Așteaptă un connection string ODBC (exact ca cel furnizat de Azure).
    """
    def __init__(self, connection_string: str = None):
        driver_path = "/opt/homebrew/Cellar/msodbcsql18/18.5.1.1/lib/libmsodbcsql.18.dylib"

        # replace driver path in connection string if it exists
        if connection_string and "Driver=" in connection_string:
            connection_string = connection_string.replace("Driver={ODBC Driver 18 for SQL Server}", f"Driver={driver_path}")
        else:
            connection_string = f"Driver={driver_path};{connection_string}" if connection_string else f"Driver={driver_path};"

        if connection_string is None:
            connection_string = os.getenv("AZURE_SQL_URL")
            if not connection_string:
                raise RuntimeError("AZURE_SQL_URL nu este setat în mediul de execuție")
        self.connection_string = connection_string

    def get_connection(self):
        """
        Returnează un obiect pyodbc.Connection conectat la baza de date specificată
        în AZURE_SQL_URL. 
        """
        try:
            conn = pyodbc.connect(self.connection_string)
            return conn
        except Exception as e:
            raise RuntimeError(f"Nu am putut să mă conectez la Azure SQL: {e}")
