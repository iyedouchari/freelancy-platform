CREATE DATABASE IF NOT EXISTS project;
USE project;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('FREELANCER','CLIENT','ADMIN') NOT NULL,
    company VARCHAR(120) DEFAULT NULL,
    professional_title VARCHAR(120) DEFAULT NULL,
    location VARCHAR(120) DEFAULT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    bio VARCHAR(500) DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    points INT NOT NULL DEFAULT 0,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (email LIKE '%@%.%'),
    CONSTRAINT chk_password CHECK (CHAR_LENGTH(password) >= 10)
);

CREATE TABLE IF NOT EXISTS freelancer_domains (
    id_freelancer INT NOT NULL,
    domain VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_freelancer, domain),
    CONSTRAINT fk_fd_user FOREIGN KEY (id_freelancer)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_owner FOREIGN KEY (owner_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2) NOT NULL,
    negotiable BOOLEAN NOT NULL DEFAULT TRUE,
    deadline DATE DEFAULT NULL,
    status ENUM('Ouverte','En cours','Fermee') NOT NULL DEFAULT 'Ouverte',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_req_client FOREIGN KEY (client_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_budget CHECK (budget > 0)
);

CREATE TABLE IF NOT EXISTS proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    proposed_price DECIMAL(15,2) NOT NULL,
    proposed_deadline_at DATETIME NOT NULL,
    cover_letter TEXT DEFAULT NULL,
    status ENUM('En attente','Acceptee','Refusee') NOT NULL DEFAULT 'En attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prop_request FOREIGN KEY (request_id)
        REFERENCES requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_prop_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_one_proposal UNIQUE (request_id, freelancer_id),
    CONSTRAINT chk_prop_price CHECK (proposed_price > 0)
);

CREATE TABLE IF NOT EXISTS deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL UNIQUE,
    request_id INT NOT NULL,
    client_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    final_price DECIMAL(15,2) NOT NULL,
    advance_amount DECIMAL(15,2) NOT NULL,
    advance_due_at DATETIME NOT NULL,
    deadline DATETIME NOT NULL,
    penalty_cycles INT NOT NULL DEFAULT 0,
    submitted_at DATETIME DEFAULT NULL,
    final_paid_at DATETIME DEFAULT NULL,
    status ENUM(
        'En cours',
        'Actif',
        'Soumis',
        'En attente paiement final',
        'En attente acompte',
        'Termine',
        'Annule'
    ) NOT NULL DEFAULT 'En cours',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deal_proposal FOREIGN KEY (proposal_id)
        REFERENCES proposals(id) ON DELETE RESTRICT,
    CONSTRAINT fk_deal_request FOREIGN KEY (request_id)
        REFERENCES requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_deal_client FOREIGN KEY (client_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_deal_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_advance CHECK (advance_amount > 0),
    CONSTRAINT chk_final_price CHECK (final_price > 0)
);

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    client_id INT NOT NULL,
    freelancer_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_type ENUM('Avance', 'Paiement final') NOT NULL,
    status ENUM('En attente', 'Paye', 'Rembourse') NOT NULL DEFAULT 'En attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_payment_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_payer FOREIGN KEY (client_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_payee FOREIGN KEY (freelancer_id)
        REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_users CHECK (client_id <> freelancer_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    deal_id INT DEFAULT NULL,
    type ENUM(
        'topup',
        'advance_debit',
        'advance_credit',
        'final_debit',
        'final_credit',
        'penalty',
        'refund'
    ) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wt_wallet FOREIGN KEY (wallet_id)
        REFERENCES wallet_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_wt_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE SET NULL,
    CONSTRAINT chk_wt_amount CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL UNIQUE,
    freelancer_id INT NOT NULL,
    content TEXT DEFAULT NULL,
    file_url VARCHAR(500) DEFAULT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sub_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_msg_sender_receiver CHECK (sender_id <> receiver_id)
);

CREATE TABLE IF NOT EXISTS ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deal_id INT NOT NULL,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    score INT NOT NULL,
    comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_one_rating UNIQUE (deal_id, from_user_id),
    CONSTRAINT chk_score CHECK (score BETWEEN 1 AND 5),
    CONSTRAINT chk_not_self CHECK (from_user_id <> to_user_id),
    CONSTRAINT fk_rat_deal FOREIGN KEY (deal_id)
        REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_rat_from FOREIGN KEY (from_user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rat_to FOREIGN KEY (to_user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trig_after_insert_user;
DROP TRIGGER IF EXISTS trig_after_proposal_accept;
DROP TRIGGER IF EXISTS trig_before_payment_update;
DROP TRIGGER IF EXISTS trig_after_payment_update;

DELIMITER //

CREATE TRIGGER trig_after_insert_user
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallet_accounts (owner_id, balance)
    VALUES (NEW.id, 0.00);

    IF NEW.role = 'FREELANCER' THEN
        INSERT INTO freelancer_domains (id_freelancer, domain)
        VALUES (NEW.id, 'general');
    END IF;
END //

CREATE TRIGGER trig_after_proposal_accept
AFTER UPDATE ON proposals
FOR EACH ROW
BEGIN
    IF NEW.status = 'Acceptee' AND OLD.status <> 'Acceptee' THEN
        INSERT INTO deals (
            proposal_id,
            request_id,
            client_id,
            freelancer_id,
            final_price,
            advance_amount,
            advance_due_at,
            deadline,
            status
        )
        SELECT
            NEW.id,
            NEW.request_id,
            r.client_id,
            NEW.freelancer_id,
            NEW.proposed_price,
            ROUND(NEW.proposed_price * 0.10, 2),
            DATE_ADD(NOW(), INTERVAL 24 HOUR),
            NEW.proposed_deadline_at,
            'En cours'
        FROM requests r
        WHERE r.id = NEW.request_id;
    END IF;
END //

CREATE TRIGGER trig_before_payment_update
BEFORE UPDATE ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'Paye' AND OLD.status <> 'Paye' THEN
        SET NEW.paid_at = CURRENT_TIMESTAMP;
    END IF;

    IF NEW.status <> 'Paye' THEN
        SET NEW.paid_at = NULL;
    END IF;
END //

CREATE TRIGGER trig_after_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'Paye' AND OLD.status <> 'Paye'
       AND NEW.payment_type = 'Avance' THEN
        UPDATE deals
        SET status = 'Actif'
        WHERE id = NEW.deal_id;
    END IF;

    IF NEW.status = 'Paye' AND OLD.status <> 'Paye'
       AND NEW.payment_type = 'Paiement final' THEN
        UPDATE deals
        SET status = 'Termine',
            final_paid_at = CURRENT_TIMESTAMP
        WHERE id = NEW.deal_id;
    END IF;

    IF NEW.status = 'Rembourse' AND OLD.status <> 'Rembourse' THEN
        UPDATE deals
        SET status = 'Annule'
        WHERE id = NEW.deal_id;
    END IF;
END //

DELIMITER ;
