# hr_db/models.py

class Person:
    def __init__(self, id, first_name, last_name, email, role, department, created_at, updated_at):
        self.id = id
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.role = role
        self.department = department
        self.created_at = created_at
        self.updated_at = updated_at

    def __str__(self):
        return f"Person({self.id}, {self.first_name} {self.last_name})"

    @classmethod
    def from_tuple(cls, row):
        return cls(*row)

class Entity:
    def __init__(self, id, name, entity_type, description, vulnerability_score, connectivity, risk_score, created_at, updated_at):
        self.id = id
        self.name = name
        self.entity_type = entity_type
        self.description = description
        self.vulnerability_score = vulnerability_score
        self.connectivity = connectivity
        self.risk_score = risk_score
        self.created_at = created_at
        self.updated_at = updated_at

    def __str__(self):
        return f"Entity({self.id}, {self.name})"

    @classmethod
    def from_tuple(cls, row):
        return cls(*row)

class PsychometricAssessment:
    def __init__(self, id, person_id, awareness, conscientiousness, stress, neuroticism, risk_tolerance, created_at, updated_at):
        self.id = id
        self.person_id = person_id
        self.awareness = awareness
        self.conscientiousness = conscientiousness
        self.stress = stress
        self.neuroticism = neuroticism
        self.risk_tolerance = risk_tolerance
        self.created_at = created_at
        self.updated_at = updated_at

    def __str__(self):
        return f"PsychometricAssessment({self.id}, person_id={self.person_id})"

    @classmethod
    def from_tuple(cls, row):
        return cls(*row)

class Relationship:
    def __init__(self, id, parent_id, parent_type, child_id, child_type, relationship_type, created_at, updated_at):
        self.id = id
        self.parent_id = parent_id
        self.parent_type = parent_type
        self.child_id = child_id
        self.child_type = child_type
        self.relationship_type = relationship_type
        self.created_at = created_at
        self.updated_at = updated_at

    def __str__(self):
        return f"Relationship({self.id}, {self.parent_type}:{self.parent_id} -> {self.child_type}:{self.child_id})"

    @classmethod
    def from_tuple(cls, row):
        return cls(*row)
