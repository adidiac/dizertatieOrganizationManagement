# hr_db/dao.py

import os
from database.connection import DatabaseConnectorSQLServer
from database.models import Person, Entity, PsychometricAssessment, Relationship

class HRDatabase:
    def __init__(self, connection_url: str = None, db_name: str = "hr"):
        """
        Dacă nu se furnizează explicit connection_url, 
        se preia din variabila de mediu AZURE_SQL_URL. 
        DatabaseConnectorSQLServer va verifica automat variabila de mediu dacă i se dă None.
        """
        self.connector = DatabaseConnectorSQLServer(connection_url)

    def get_connection(self):
        # Totul este în connection string, inclusiv baza de date
        return self.connector.get_connection()

    # ----------------------------------
    # Persons CRUD
    # ----------------------------------
    def get_person_by_id(self, person_id: int) -> Person:
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT id, first_name, last_name, email, role, department, created_at, updated_at
              FROM persons
             WHERE id = ?
        """
        cursor.execute(query, (person_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if row:
            return Person.from_tuple(row)
        return None

    def get_all_persons(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT id, first_name, last_name, email, role, department, created_at, updated_at
              FROM persons
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [Person.from_tuple(row) for row in rows]

    def insert_person(self, first_name, last_name, email, role, department) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()

        # 1) Rulăm INSERT și SELECT SCOPE_IDENTITY() în același batch
        sql = """
            INSERT INTO persons (first_name, last_name, email, role, department)
            VALUES (?, ?, ?, ?, ?);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
        """
        cursor.execute(sql, (first_name, last_name, email, role, department))

        # 2) Pyodbc trebuie să treacă la următorul result set
        cursor.nextset()
        row = cursor.fetchone()

        conn.commit()
        cursor.close()
        conn.close()

        if row and row[0] is not None:
            return int(row[0])
        else:
            raise RuntimeError("Nu s-a putut obține ID-ul nou creat pentru persons")

    def delete_person(self, person_id: int) -> None:
        conn = self.get_connection()
        cursor = conn.cursor()
        # Șterg psihometrice asociate
        cursor.execute("DELETE FROM psychometric_assessments WHERE person_id = ?;", (person_id,))
        # Șterg relațiile
        cursor.execute("DELETE FROM relationships WHERE parent_id = ? OR child_id = ?;", (person_id, person_id))
        # Șterg persoana
        cursor.execute("DELETE FROM persons WHERE id = ?;", (person_id,))
        conn.commit()
        cursor.close()
        conn.close()

    # ----------------------------------
    # Psychometric Assessments CRUD
    # ----------------------------------
    def get_all_psychometric_assessments(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT id, person_id, awareness, conscientiousness, stress, neuroticism, risk_tolerance, created_at, updated_at
              FROM psychometric_assessments
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [PsychometricAssessment.from_tuple(row) for row in rows]

    def insert_psychometric_assessment(self, person_id, awareness, conscientiousness, stress, neuroticism, risk_tolerance) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()

        sql = """
            INSERT INTO psychometric_assessments
              (person_id, awareness, conscientiousness, stress, neuroticism, risk_tolerance)
            VALUES (?, ?, ?, ?, ?, ?);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
        """
        cursor.execute(sql, (person_id, awareness, conscientiousness, stress, neuroticism, risk_tolerance))
        cursor.nextset()
        row = cursor.fetchone()

        conn.commit()
        cursor.close()
        conn.close()

        if row and row[0] is not None:
            return int(row[0])
        else:
            raise RuntimeError("Nu s-a putut obține ID-ul nou creat pentru psychometric_assessments")

    # ----------------------------------
    # Entities CRUD
    # ----------------------------------
    def get_entity_by_id(self, entity_id: int) -> Entity:
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT id, name, entity_type, description, vulnerability_score, connectivity, risk_score, created_at, updated_at
              FROM entities
             WHERE id = ?
        """
        cursor.execute(query, (entity_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if row:
            return Entity.from_tuple(row)
        return None

    def get_all_entities(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT id, name, entity_type, description, vulnerability_score, connectivity, risk_score, created_at, updated_at
              FROM entities
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [Entity.from_tuple(row) for row in rows]

    def insert_entity(self, name, entity_type, description, vulnerability_score, connectivity, risk_score) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()

        sql = """
            INSERT INTO entities
              (name, entity_type, description, vulnerability_score, connectivity, risk_score)
            VALUES (?, ?, ?, ?, ?, ?);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
        """
        cursor.execute(sql, (name, entity_type, description, vulnerability_score, connectivity, risk_score))
        cursor.nextset()
        row = cursor.fetchone()

        conn.commit()
        cursor.close()
        conn.close()

        if row and row[0] is not None:
            return int(row[0])
        else:
            raise RuntimeError("Nu s-a putut obține ID-ul nou creat pentru entities")

    # ----------------------------------
    # Relationships CRUD
    # ----------------------------------
    def get_all_relationships(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        query = """
            SELECT id, parent_id, parent_type, child_id, child_type, relationship_type, created_at, updated_at
              FROM relationships
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [Relationship.from_tuple(row) for row in rows]

    def insert_relationship(self, parent_id, parent_type, child_id, child_type, relationship_type) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()

        sql = """
            INSERT INTO relationships
              (parent_id, parent_type, child_id, child_type, relationship_type)
            VALUES (?, ?, ?, ?, ?);
            SELECT CAST(SCOPE_IDENTITY() AS INT);
        """
        cursor.execute(sql, (parent_id, parent_type, child_id, child_type, relationship_type))
        cursor.nextset()
        row = cursor.fetchone()

        conn.commit()
        cursor.close()
        conn.close()

        if row and row[0] is not None:
            return int(row[0])
        else:
            raise RuntimeError("Nu s-a putut obține ID-ul nou creat pentru relationships")

    def delete_entity(self, entity_id: int) -> None:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM relationships WHERE parent_id = ? OR child_id = ?;", (entity_id, entity_id))
        cursor.execute("DELETE FROM entities WHERE id = ?;", (entity_id,))
        conn.commit()
        cursor.close()
        conn.close()
