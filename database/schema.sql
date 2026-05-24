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

CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id),
    record_date DATE NOT NULL,
    type VARCHAR(100), -- Vaccination, Treatment, Deworming
    description TEXT,
    cost DECIMAL(12,2)
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
