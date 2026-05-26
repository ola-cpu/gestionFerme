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
-- 2. STOCKS & MAGASIN
-- ==========================================

CREATE TABLE stock_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

INSERT INTO stock_categories (name) VALUES
('Aliments'), ('Médicaments/Véto'), ('Intrants agricoles'), ('Emballages'), ('Carburant'), ('Pièces'), ('Produits finis');

CREATE TABLE stock_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES stock_categories(id),
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20), -- kg, L, unit
    minimum_threshold DECIMAL(10,2),
    current_stock DECIMAL(10,2) DEFAULT 0,
    valuation_method VARCHAR(10) DEFAULT 'CMUP', -- FIFO, CMUP
    is_product BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE stock_batches (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER REFERENCES stock_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE,
    initial_quantity DECIMAL(10,2) NOT NULL,
    current_quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2), -- purchase price for valuation
    received_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER REFERENCES stock_items(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES stock_batches(id) ON DELETE SET NULL,
    movement_type VARCHAR(10) NOT NULL, -- IN, OUT, ADJUST
    quantity DECIMAL(10,2) NOT NULL,
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT, -- e.g., 'Purchase', 'Use in Crops', 'Inventory Discrepancy'
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE inventory_takes (
    id SERIAL PRIMARY KEY,
    take_date DATE DEFAULT CURRENT_DATE,
    performed_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Completed'
);

CREATE TABLE inventory_take_items (
    id SERIAL PRIMARY KEY,
    inventory_take_id INTEGER REFERENCES inventory_takes(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    theoretical_quantity DECIMAL(10,2),
    actual_quantity DECIMAL(10,2),
    discrepancy DECIMAL(10,2)
);

-- ==========================================
-- 3. CULTURES (Crops)
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
    season VARCHAR(50),
    planting_date DATE,
    harvest_date DATE,
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2)
);

CREATE TABLE crop_tasks (
    id SERIAL PRIMARY KEY,
    crop_cycle_id INTEGER REFERENCES crop_cycles(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL, -- labour, semis, désherbage, irrigation, récolte, etc.
    task_date DATE NOT NULL,
    description TEXT,
    cost DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE crop_inputs (
    id SERIAL PRIMARY KEY,
    crop_task_id INTEGER REFERENCES crop_tasks(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    cost DECIMAL(12,2) DEFAULT 0
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

CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    request_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected, Ordered
    validation_date DATE,
    validator_id INTEGER REFERENCES users(id)
);

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_request_id INTEGER REFERENCES purchase_requests(id) ON DELETE SET NULL,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(15,2),
    status VARCHAR(50) -- Ordered, Received, Paid, Cancelled
);

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL
);

CREATE TABLE quality_controls (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    check_date DATE DEFAULT CURRENT_DATE,
    is_conform BOOLEAN DEFAULT TRUE,
    non_conformity_details TEXT,
    action_taken TEXT, -- e.g., 'Returned', 'Accepted with discount'
    controller_id INTEGER REFERENCES users(id)
);

CREATE TABLE supplier_price_history (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    stock_item_id INTEGER REFERENCES stock_items(id) ON DELETE CASCADE,
    price DECIMAL(12,2) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE
);

-- ==========================================
-- 5. VENTES (Sales)
-- ==========================================

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- Wholesaler, Retailer, Restaurateur, Market
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    sale_date DATE NOT NULL,
    total_amount DECIMAL(15,2),
    payment_status VARCHAR(50), -- Pending, Paid, Partial
    document_type VARCHAR(50), -- Devis, Bon de commande, Facture
    reference_number VARCHAR(50) UNIQUE,
    delivery_status VARCHAR(50) -- Pending, Shipped, Delivered
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES livestock_batches(id),
    individual_id INTEGER REFERENCES livestock_individuals(id),
    stock_item_id INTEGER REFERENCES stock_items(id), -- For crops, eggs, etc.
    product_description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    total_price DECIMAL(15,2)
);

CREATE TABLE sale_payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) -- Cash, Mobile Money, Bank Transfer
);

CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5,2),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE
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
    base_salary DECIMAL(12,2),
    contract_type VARCHAR(50), -- Permanent, CDD, Seasonal
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(50) -- Present, Absent, Leave
);

CREATE TABLE payrolls (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    month INTEGER,
    year INTEGER,
    payment_date DATE DEFAULT CURRENT_DATE,
    base_salary_paid DECIMAL(12,2),
    bonuses DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0, -- Advances, taxes, etc.
    net_salary DECIMAL(12,2)
);

CREATE TABLE work_schedules (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(50), -- Morning, Afternoon, Night
    tasks TEXT
);

-- ==========================================
-- 7. TRÉSORERIE (Finance)
-- ==========================================

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(10), -- IN / OUT
    category VARCHAR(100),
    activity VARCHAR(50), -- Élevage, Cultures, Atelier, General
    source VARCHAR(50), -- Caisse, Banque
    amount DECIMAL(15,2),
    description TEXT
);

CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    activity VARCHAR(50) NOT NULL, -- Élevage, Cultures, Atelier, etc.
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0
);

-- ==========================================
-- 8. MAINTENANCE & ACTIFS (Assets)
-- ==========================================

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- Équipement, Véhicule, Bâtiment
    purchase_date DATE,
    purchase_price DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'Actif' -- Actif, En maintenance, Hors service
);

CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    description TEXT,
    task_type VARCHAR(50), -- Entretien, Réparation
    parts_used TEXT,
    cost DECIMAL(12,2),
    next_due_date DATE
);
