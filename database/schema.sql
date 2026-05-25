-- Schema for Gestock-Ferme
-- Integrated Management System for Farms

-- ==========================================
-- 0. CORE / SHARED
-- ==========================================

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Initial roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Administrateur avec tous les accès'),
('Gestionnaire', 'Gestionnaire de la ferme'),
('Magasinier', 'Gestionnaire des stocks'),
('Vétérinaire', 'Suivi sanitaire de l''élevage'),
('RH', 'Gestion du personnel et de la paie'),
('Ventes', 'Gestion des ventes et des clients');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 1. ÉLEVAGE (Livestock)
-- ==========================================

CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL -- Bovins, Ovins, Volailles, etc.
);

-- Initial species
INSERT INTO species (name) VALUES
('Bovins'), ('Ovins'), ('Caprins'), ('Volailles'), ('Porcins'), ('Poissons');

CREATE TABLE livestock_batches (
    id SERIAL PRIMARY KEY,
    species_id INTEGER REFERENCES species(id),
    batch_name VARCHAR(100) NOT NULL,
    arrival_date DATE,
    birth_date DATE,
    initial_count INTEGER,
    current_count INTEGER,
    status VARCHAR(50) DEFAULT 'Active' -- Active, Sold, Finished
);

CREATE TABLE livestock_individuals (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    identification_code VARCHAR(50) UNIQUE,
    birth_date DATE,
    gender VARCHAR(10), -- Male, Female
    status VARCHAR(50) DEFAULT 'Active' -- Active, Sold, Deceased
);

CREATE TABLE weight_records (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    individual_id INTEGER REFERENCES livestock_individuals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    weight DECIMAL(10,2) NOT NULL
);

CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    individual_id INTEGER REFERENCES livestock_individuals(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    type VARCHAR(100), -- Vaccination, Treatment, Deworming
    description TEXT,
    cost DECIMAL(12,2)
);

CREATE TABLE feeding_records (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    feed_type VARCHAR(100),
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    cost DECIMAL(12,2)
);

CREATE TABLE reproduction_records (
    id SERIAL PRIMARY KEY,
    individual_id INTEGER REFERENCES livestock_individuals(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_type VARCHAR(50), -- Heat, Insemination, Birth
    result TEXT
);

CREATE TABLE mortality_records (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    individual_id INTEGER REFERENCES livestock_individuals(id) ON DELETE CASCADE,
    mortality_date DATE NOT NULL,
    cause TEXT
);

-- ==========================================
-- 2. CULTURES (Crops)
-- ==========================================

CREATE TABLE plots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    area_hectares DECIMAL(10,2),
    soil_type VARCHAR(100)
);

CREATE TABLE crop_cycles (
    id SERIAL PRIMARY KEY,
    plot_id INTEGER REFERENCES plots(id),
    crop_name VARCHAR(100) NOT NULL,
    planting_date DATE,
    harvest_date DATE,
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2)
);

-- ==========================================
-- 3. STOCKS & MAGASIN
-- ==========================================

CREATE TABLE stock_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL -- Aliments, Médicaments, Intrants, etc.
);

CREATE TABLE stock_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES stock_categories(id),
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20), -- kg, L, unit
    minimum_threshold DECIMAL(10,2),
    current_stock DECIMAL(10,2) DEFAULT 0
);

-- ==========================================
-- 4. ACHATS (Purchases)
-- ==========================================

CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(15,2),
    status VARCHAR(50) -- Ordered, Received, Paid
);

-- ==========================================
-- 5. VENTES (Sales)
-- ==========================================

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- Wholesaler, Retailer, Individual
    phone VARCHAR(20)
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    sale_date DATE NOT NULL,
    total_amount DECIMAL(15,2),
    payment_status VARCHAR(50) -- Pending, Paid, Partial
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES livestock_batches(id),
    individual_id INTEGER REFERENCES livestock_individuals(id),
    product_description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    total_price DECIMAL(15,2)
);

-- ==========================================
-- 6. PERSONNEL & PAIE
-- ==========================================

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    position VARCHAR(100),
    hire_date DATE,
    base_salary DECIMAL(12,2)
);

-- ==========================================
-- 7. TRÉSORERIE (Finance)
-- ==========================================

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(10), -- IN / OUT
    category VARCHAR(100),
    amount DECIMAL(15,2),
    description TEXT
);
-- Maintenance Table
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    asset_name VARCHAR(100) NOT NULL, -- Equipment, Vehicle, Building
    maintenance_date DATE NOT NULL,
    description TEXT,
    cost DECIMAL(12,2),
    next_due_date DATE
);
