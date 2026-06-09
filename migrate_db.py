import pymysql

try:
    connection = pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='72655883cristian',
        database='geoturismo',
        port=3306
    )

    with connection.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_categoria (
                idcategoria INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                estado INT DEFAULT 1
            );
        """)
        try:
            cursor.execute("ALTER TABLE proyecto ADD COLUMN idcategoria INT NULL;")
        except Exception as e:
            print("Column idcategoria might already exist:", e)
            
        try:
            cursor.execute("ALTER TABLE proyecto ADD CONSTRAINT fk_proyecto_categoria FOREIGN KEY (idcategoria) REFERENCES api_categoria(idcategoria);")
        except Exception as e:
            print("Constraint might already exist:", e)
        
        cursor.execute("SELECT COUNT(*) FROM api_categoria;")
        count = cursor.fetchone()[0]
        if count == 0:
            cursor.execute("INSERT INTO api_categoria (nombre, estado) VALUES ('Piscinas', 1), ('Cataratas', 1), ('Recreos Campestres', 1), ('Miradores', 1), ('Aventura', 1);")
            print("Inserted default categories.")
            
    connection.commit()
    connection.close()
    print("Database migration completed successfully.")
except Exception as e:
    print(f"Error: {e}")
