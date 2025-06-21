-- Drop tables în ordinea inversă
IF OBJECT_ID('relationships', 'U') IS NOT NULL DROP TABLE relationships;
IF OBJECT_ID('psychometric_assessments', 'U') IS NOT NULL DROP TABLE psychometric_assessments;
IF OBJECT_ID('entities', 'U') IS NOT NULL DROP TABLE entities;
IF OBJECT_ID('persons', 'U') IS NOT NULL DROP TABLE persons;

-- Creează tabela persons
CREATE TABLE persons (
    id INT IDENTITY(1,1) PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(80),
    department VARCHAR(80),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Creează tabela entities
CREATE TABLE entities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    description NVARCHAR(MAX),
    vulnerability_score FLOAT,
    connectivity FLOAT,
    risk_score FLOAT,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Creează tabela psychometric_assessments
CREATE TABLE psychometric_assessments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    person_id INT NOT NULL FOREIGN KEY REFERENCES persons(id) ON DELETE CASCADE,
    awareness FLOAT,
    conscientiousness FLOAT,
    stress FLOAT,
    neuroticism FLOAT,
    risk_tolerance FLOAT,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Creează tabela relationships
CREATE TABLE relationships (
    id INT IDENTITY(1,1) PRIMARY KEY,
    parent_id INT NOT NULL,
    parent_type VARCHAR(50) NOT NULL,
    child_id INT NOT NULL,
    child_type VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- Indexuri opționale
CREATE INDEX idx_relationships_parent ON relationships(parent_type, parent_id);
CREATE INDEX idx_relationships_child ON relationships(child_type, child_id);

-- Inserționare mock data
INSERT INTO persons (first_name, last_name, email, role, department) VALUES
('Alice', 'Smith', 'alice.smith@example.com', 'Manager', 'IT'),
('Bob', 'Johnson', 'bob.johnson@example.com', 'Analyst', 'IT'),
('Carol', 'Williams', 'carol.williams@example.com', 'Engineer', 'Development');

INSERT INTO entities (name, entity_type, description, vulnerability_score, connectivity, risk_score) VALUES
('Server A', 'server', 'Critical database server', 7.5, 8.0, 5.0),
('Workstation X', 'computer', 'Employee workstation', 3.2, 5.0, 2.5),
('SubOrg Y', 'suborganization', 'Sub-department within IT', 0, 0, 0);

INSERT INTO psychometric_assessments (person_id, awareness, conscientiousness, stress, neuroticism, risk_tolerance) VALUES
(1, 0.9, 0.85, 0.3, 0.2, 0.15),
(2, 0.6, 0.7, 0.5, 0.4, 0.5),
(3, 0.8, 0.75, 0.4, 0.3, 0.2);

INSERT INTO relationships (parent_id, parent_type, child_id, child_type, relationship_type) VALUES
(1, 'person', 2, 'person', 'manages'),
(2, 'person', 3, 'person', 'collaborates'),
(1, 'person', 1, 'entity', 'owns'),
(2, 'person', 3, 'entity', 'belongs_to');
