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
('Chef d’élevage', 'Responsable de la production animale'),
('Magasinier', 'Gestionnaire des stocks et du magasin'),
('Vétérinaire/technicien', 'Suivi sanitaire et mortalité'),
('Commercial', 'Gestion des ventes et des clients'),
('RH/Comptable', 'Gestion du personnel, paie et comptabilité');

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
    name VARCHAR(50) NOT NULL, -- Bovins, Ovins, Volailles, etc.
    gestation_duration_days INTEGER,
    adult_age_months INTEGER,
    feed_type VARCHAR(100),
    care_frequency VARCHAR(100),
    fattening_duration_days INTEGER,
    avg_weight_kg DECIMAL(10,2),
    expected_yield DECIMAL(10,2)
);

-- Initial species
INSERT INTO species (name, gestation_duration_days, adult_age_months, feed_type, avg_weight_kg) VALUES
('Bovins', 283, 24, 'Herbe/Fourrage', 450.00),
('Ovins', 150, 12, 'Herbe', 60.00),
('Caprins', 150, 12, 'Herbe/Arbustes', 50.00),
('Volailles', 21, 6, 'Grains', 2.50),
('Porcins', 114, 10, 'Tout', 100.00),
('Poissons', 0, 12, 'Granulés', 1.00);

CREATE TABLE breeds (
    id SERIAL PRIMARY KEY,
    species_id INTEGER REFERENCES species(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL
);

INSERT INTO breeds (species_id, name) VALUES
(1, 'Goudali'), (3, 'Boer'), (4, 'Ponte locale');

CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) -- Écurie, Poulailler, etc.
);

CREATE TABLE pens (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER
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

CREATE TABLE livestock_individuals (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    breed_id INTEGER REFERENCES breeds(id),
    pen_id INTEGER REFERENCES pens(id),
    mother_id INTEGER REFERENCES livestock_individuals(id),
    father_id INTEGER REFERENCES livestock_individuals(id),
    identification_code VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(10), -- Male, Female
    provenance VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active' -- Active, Sold, Deceased, Reproducteur, Engraissement, Gestante, Malade, Réformé
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
    cost DECIMAL(12,2),
    vaccine_batch_number VARCHAR(50),
    practitioner VARCHAR(100),
    next_due_date DATE
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
    partner_id INTEGER REFERENCES livestock_individuals(id),
    event_date DATE NOT NULL,
    event_type VARCHAR(50), -- Heat, Insemination, Mating, Birth
    expected_birth_date DATE,
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

CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- Magasin, Entrepôt, Dépôt
    location TEXT,
    capacity DECIMAL(10,2),
    manager_id INTEGER REFERENCES users(id),
    conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE storage_zones (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE stock_categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES stock_categories(id),
    name VARCHAR(100) NOT NULL
);

INSERT INTO stock_categories (name) VALUES
('Aliments'), ('Médicaments/Véto'), ('Intrants agricoles'), ('Emballages'), ('Carburant'), ('Pièces'), ('Produits finis');

CREATE TABLE stock_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES stock_categories(id),
    code VARCHAR(50) UNIQUE,
    qr_code VARCHAR(100) UNIQUE,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20), -- kg, L, unit
    minimum_threshold DECIMAL(10,2),
    maximum_threshold DECIMAL(10,2),
    current_stock DECIMAL(10,2) DEFAULT 0,
    valuation_method VARCHAR(10) DEFAULT 'CMUP', -- FIFO, CMUP
    is_product BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(12,2) DEFAULT 0,
    image_url TEXT,
    technical_sheet_url TEXT
);

CREATE TABLE stock_batches (
    id SERIAL PRIMARY KEY,
    stock_item_id INTEGER REFERENCES stock_items(id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES warehouses(id),
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
    warehouse_id INTEGER REFERENCES warehouses(id),
    movement_type VARCHAR(10) NOT NULL, -- IN, OUT, ADJUST
    quantity DECIMAL(10,2) NOT NULL,
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT, -- e.g., 'Purchase', 'Use in Crops', 'Inventory Discrepancy'
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    from_warehouse_id INTEGER REFERENCES warehouses(id),
    to_warehouse_id INTEGER REFERENCES warehouses(id),
    stock_item_id INTEGER REFERENCES stock_items(id),
    batch_id INTEGER REFERENCES stock_batches(id),
    quantity DECIMAL(10,2) NOT NULL,
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Completed', -- Pending, Completed, Cancelled
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
    soil_type VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    fertility_level VARCHAR(50),
    water_availability VARCHAR(50),
    responsible_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Disponible' -- Disponible, Occupé, En jachère
);

CREATE TABLE crop_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    cycle_duration_days INTEGER,
    water_needs TEXT,
    fertilizer_needs TEXT,
    expected_yield_per_ha DECIMAL(10,2)
);

CREATE TABLE agricultural_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'En cours' -- En cours, Terminé, Planifié
);

CREATE TABLE crop_cycles (
    id SERIAL PRIMARY KEY,
    plot_id INTEGER REFERENCES plots(id),
    campaign_id INTEGER REFERENCES agricultural_campaigns(id),
    crop_type_id INTEGER REFERENCES crop_types(id),
    crop_name VARCHAR(100) NOT NULL,
    season VARCHAR(50),
    planting_date DATE,
    harvest_date DATE,
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2)
);

CREATE TABLE agronomic_observations (
    id SERIAL PRIMARY KEY,
    crop_cycle_id INTEGER REFERENCES crop_cycles(id) ON DELETE CASCADE,
    observation_date DATE NOT NULL,
    growth_stage VARCHAR(100),
    health_status VARCHAR(100),
    pests_observations TEXT,
    diseases_observations TEXT,
    recommendations TEXT,
    photo_url TEXT,
    recorded_by INTEGER REFERENCES users(id)
);

CREATE TABLE irrigation_records (
    id SERIAL PRIMARY KEY,
    crop_cycle_id INTEGER REFERENCES crop_cycles(id) ON DELETE CASCADE,
    irrigation_date DATE NOT NULL,
    water_quantity_m3 DECIMAL(10,2),
    duration_minutes INTEGER,
    cost DECIMAL(12,2) DEFAULT 0,
    method VARCHAR(50) -- Goutte-à-goutte, Aspersion, etc.
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
    category VARCHAR(50), -- Local, International, Grossiste, Producteur
    is_international BOOLEAN DEFAULT FALSE,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    delivery_lead_time_days INTEGER,
    payment_conditions TEXT
);

CREATE TABLE purchase_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    department VARCHAR(50), -- Élevage, Agriculture, Production, Maintenance, Administration
    request_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    urgency VARCHAR(20) DEFAULT 'Normale', -- Basse, Normale, Haute, Critique
    justification TEXT,
    estimated_budget DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'Brouillon', -- Brouillon, Soumis, Validé, Rejeté, Commandé, Réceptionné
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
    received_quantity DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL
);

CREATE TABLE purchase_receptions (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    reception_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_by INTEGER REFERENCES users(id),
    delivery_note_ref VARCHAR(100),
    notes TEXT
);

CREATE TABLE purchase_reception_items (
    id SERIAL PRIMARY KEY,
    reception_id INTEGER REFERENCES purchase_receptions(id) ON DELETE CASCADE,
    purchase_item_id INTEGER REFERENCES purchase_items(id),
    stock_item_id INTEGER REFERENCES stock_items(id),
    batch_id INTEGER REFERENCES stock_batches(id),
    quantity_received DECIMAL(10,2) NOT NULL,
    quantity_rejected DECIMAL(10,2) DEFAULT 0,
    expiry_date DATE, -- For lot creation
    lot_number VARCHAR(50)
);

CREATE TABLE quality_controls (
    id SERIAL PRIMARY KEY,
    reception_id INTEGER REFERENCES purchase_receptions(id) ON DELETE CASCADE,
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
    address TEXT,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    sale_date DATE NOT NULL,
    total_amount DECIMAL(15,2),
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(50), -- Pending, Paid, Partial
    document_type VARCHAR(50), -- Devis, Bon de commande, Facture
    reference_number VARCHAR(50) UNIQUE,
    delivery_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Shipped, Delivered
    valid_until DATE -- For Devis
);

CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    driver_name VARCHAR(100),
    vehicle_plate VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Transit, Delivered, Cancelled
    tracking_number VARCHAR(100),
    signature_url TEXT,
    notes TEXT
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

-- ==========================================
-- 9. AUDIT & COMPLIANCE
-- ==========================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slaughter_records (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES livestock_batches(id) ON DELETE CASCADE,
    individual_id INTEGER REFERENCES livestock_individuals(id) ON DELETE CASCADE,
    slaughter_date DATE NOT NULL,
    location VARCHAR(255),
    health_certificate_ref VARCHAR(100),
    inspector_name VARCHAR(100),
    details TEXT
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50), -- Vaccine, Birth, Heat, Stock
    message TEXT NOT NULL,
    record_id INTEGER,
    table_name VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
