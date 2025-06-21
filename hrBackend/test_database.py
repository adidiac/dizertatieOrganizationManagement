# database/tests/test_database.py
import unittest
from database.dao import HRDatabase  # relative import from the parent package
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Replace with your actual Railway MySQL URL.
CONNECTION_URL = os.getenv("AZURE_SQL_URL")

class TestDatabase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = HRDatabase(CONNECTION_URL, db_name="hr")

    # def test_insert_and_get_person(self):
    #     # Insert a new person
    #     new_id = self.db.insert_person("Test", "User", "test.user@example.com", "Tester", "QA")
    #     self.assertIsNotNone(new_id)
    #     # Retrieve the person
    #     person = self.db.get_person_by_id(new_id)
    #     self.assertIsNotNone(person)
    #     self.assertEqual(person.first_name, "Test")
    #     self.assertEqual(person.email, "test.user@example.com")

    def test_get_all_persons(self):
        persons = self.db.get_all_persons()
        print(f"Retrieved {len(persons)} persons from the database.")
        self.assertIsInstance(persons, list)
        self.assertGreaterEqual(len(persons), 1)

    # def test_insert_and_get_psychometric_assessment(self):
    #     # First, insert a test person so we have a valid person_id
    #     person_id = self.db.insert_person("Assess", "Test", "assess.test@example.com", "Analyst", "IT")
    #     new_assessment_id = self.db.insert_psychometric_assessment(person_id, 0.8, 0.75, 0.4, 0.3, 0.2)
    #     self.assertIsNotNone(new_assessment_id)
    #     assessments = self.db.get_all_psychometric_assessments()
    #     found = any(assessment.person_id == person_id for assessment in assessments)
    #     self.assertTrue(found)

if __name__ == '__main__':
    unittest.main()
