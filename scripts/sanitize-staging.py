#!/usr/bin/env python3
"""
Automated Sanitization & Anonymization Script for ECGBC Staging Environment
Replaces all sensitive church data, personal names, phone numbers, emails, bank refs,
and deletes all logins except the 4 INSA audit accounts.
"""

import sys
import subprocess

DENOMINATIONS = [
    ("መሰረተ ክርስቶስ ቤተክርስቲያን", "Meserete Kristos Church"),
    ("የኢትዮጵያ ሙሉ ወንጌል አማኞች ቤተክርስቲያን", "Ethiopian Full Gospel Believers Church"),
    ("የኢትዮጵያ ቃለ ሕይወት ቤተክርስቲያን", "Ethiopian Kale Heywet Church"),
    ("የኢትዮጵያ ወንጌላዊት ቤተክርስቲያን መካነ ኢየሱስ", "Ethiopian Evangelical Church Mekane Yesus"),
    ("ብርሃነ ወንጌል አጥቢያ ቤተክርስቲያን", "Gospel Light Local Church"),
    ("አማኑኤል ኅብረት ቤተክርስቲያን", "Emmanuel Fellowship Church"),
    ("ሕይወት ብርሃን ቤተክርስቲያን", "Life Light Church"),
    ("ፀጋው ድንቅ ዓለም አቀፍ ቤተክርስቲያን", "Amazing Grace International Church"),
    ("የክርስቶስ ቤተሰብ አማኞች አጥቢያ", "Family of Christ Believers Assembly"),
    ("ገሊላ ኅብረት ቤተክርስቲያን", "Galilee Fellowship Church"),
    ("ራዕይ ወንጌላዊት ቤተክርስቲያን", "Vision Evangelical Church"),
    ("ሰላም ባለራዕዮች አብያተ ክርስቲያናት", "Peace Visionary Church"),
]

LOCALITIES = [
    ("መገናኛ ጉባኤ", "Megenagna Assembly"),
    ("ቦሌ አማኑኤል አጥቢያ", "Bole Emmanuel Branch"),
    ("ፒያሳ ማዕከል", "Piazza Center"),
    ("ቄራ ጽዮን ጉባኤ", "Kera Zion Assembly"),
    ("ገርጂ ብርሃን አጥቢያ", "Gerji Light Branch"),
    ("ቃሊቲ መካነ ሰላም", "Kality Haven of Peace"),
    ("ሳሪስ ኅብረት ጉባኤ", "Saris Fellowship Assembly"),
    ("ኮልፌ አጥቢያ", "Kolfe Branch"),
    ("አያት ማዕከላዊ ጉባኤ", "Ayat Central Assembly"),
    ("ጃሞ ሰላም አጥቢያ", "Jomo Peace Branch"),
    ("ሲኤምሲ ጽዮን ጉባኤ", "CMC Zion Assembly"),
    ("ለቡ ተስፋ አጥቢያ", "Lebu Hope Branch"),
    ("መርካቶ ጉባኤ", "Merkato Assembly"),
    ("ካዛንቺስ ኅብረት", "Kazanchis Fellowship"),
    ("ወሎ ሰፈር አጥቢያ", "Wollo Sefer Branch"),
    ("አዳማ ጽዮን ጉባኤ", "Adama Zion Assembly"),
    ("ቢሾፍቱ ብርሃን አጥቢያ", "Bishoftu Light Branch"),
    ("ሀዋሳ ማዕከል", "Hawassa Center"),
    ("ባህር ዳር ጉባኤ", "Bahir Dar Assembly"),
    ("ድሬዳዋ ኅብረት አጥቢያ", "Dire Dawa Fellowship Branch"),
]

FIRST_NAMES = [
    ("ዮሐንስ", "Yohannes"), ("ዳዊት", "Dawit"), ("ሰለሞን", "Solomon"),
    ("ሳሙኤል", "Samuel"), ("ጴጥሮስ", "Petros"), ("ማቴዎስ", "Matewos"),
    ("ቴዎድሮስ", "Tewodros"), ("አማኑኤል", "Amanuel"), ("ኤልያስ", "Elias"),
    ("ዳንኤል", "Daniel"), ("ሚካኤል", "Michael"), ("ዮናስ", "Yonas"),
    ("ብርሃኑ", "Berhanu"), ("ተስፋዬ", "Tesfaye"), ("አለሙ", "Alemu"),
    ("አስፋው", "Asfaw"), ("ግርማ", "Girma"), ("ታደሰ", "Tadesse"),
    ("መሳይ", "Mesay"), ("ታምራት", "Tamirat"), ("ገዛኸኝ", "Gezahegn"),
    ("በቀለ", "Bekele"), ("ወርቁ", "Worku"), ("አሰፋ", "Assefa"),
    ("ዘላለም", "Zelalem"), ("እንዳለ", "Endale"), ("ዮሴፍ", "Yosef"),
    ("ማርቆስ", "Markos"), ("አብርሃም", "Abraham"), ("ይስሐቅ", "Yishak")
]

LAST_NAMES = [
    ("ተስፋዬ", "Tesfaye"), ("በቀለ", "Bekele"), ("አለሙ", "Alemu"),
    ("አበበ", "Abebe"), ("ከበደ", "Kebede"), ("ታደሰ", "Tadesse"),
    ("ሀብቴ", "Habte"), ("ገብሬ", "Gebre"), ("አሰፋ", "Assefa"),
    ("ወርቁ", "Worku"), ("ለማ", "Lema"), ("ገዛኸኝ", "Gezahegn"),
    ("ደስታ", "Desta"), ("ሞላ", "Molla"), ("በላይ", "Belay"),
    ("ንጉሴ", "Negussie"), ("ስዩም", "Seyoum"), ("ታምራት", "Tamirat"),
    ("ታፈሰ", "Tafese"), ("አድማሱ", "Admasu"), ("ጥላሁን", "Tilahun"),
    ("ካሳሁን", "Kassahun"), ("ተፈራ", "Tefera"), ("ፍቃዱ", "Fekadu"),
    ("ይመር", "Yimer"), ("አስረስ", "Asres"), ("መንግስቱ", "Mengistu"),
    ("ሃይሉ", "Hailu"), ("ገብረመድህን", "Gebremedhin"), ("ብርሃኑ", "Berhanu")
]

def escape_sql(val):
    if val is None:
        return "NULL"
    s = str(val).replace("\\", "\\\\").replace("'", "''")
    return f"'{s}'"

def run_mysql_query(db_name, query):
    cmd = [
        "docker", "exec", "ecgbc-db",
        "mysql", "-uecgbc_user", "-pecgbc_password123",
        "--default-character-set=utf8mb4",
        db_name, "-N", "-e", query
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"MySQL error: {proc.stderr.strip()}")
    return proc.stdout

def run_mysql_script(db_name, script_path):
    cmd = f"docker exec -i ecgbc-db mysql -uecgbc_user -pecgbc_password123 --default-character-set=utf8mb4 {db_name} < {script_path}"
    proc = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Script error: {proc.stderr.strip()}")
    return proc.stdout

def main():
    print("=================================================================")
    print("   ECGBC STAGING SANITIZATION & ANONYMIZATION ENGINE")
    print("=================================================================\n")

    target_db = "ecgbc_staging"

    # Step 1: Safety verification
    print(f"[*] Verifying target database...")
    active_db = run_mysql_query(target_db, "SELECT DATABASE();").strip()
    if active_db != "ecgbc_staging":
        print(f"FATAL: Target database is '{active_db}', expected 'ecgbc_staging'! Aborting!")
        sys.exit(1)
    print("    Safety verified: Target is ecgbc_staging.")

    # Step 2: Query INSA accounts and essential references
    print("[*] Retrieving INSA test account IDs...")
    staff_insa = run_mysql_query(target_db, "SELECT id, email, roleId FROM staff WHERE email LIKE 'insa-%';")
    insa_admin_id = None
    insa_reviewer_id = None
    owner_role_id = None
    staff_role_id = None

    for line in staff_insa.strip().split("\n"):
        parts = line.split("\t")
        if len(parts) >= 2:
            s_id, email = parts[0], parts[1]
            if email == "insa-admin@ecgbc.org":
                insa_admin_id = s_id
                owner_role_id = parts[2] if len(parts) > 2 else None
            elif email == "insa-reviewer@ecgbc.org":
                insa_reviewer_id = s_id
                staff_role_id = parts[2] if len(parts) > 2 else None

    # Get active state ID
    active_state_id = run_mysql_query(target_db, "SELECT id FROM datalookup WHERE value = 'object_state_active' LIMIT 1;").strip()
    if not active_state_id:
        active_state_id = run_mysql_query(target_db, "SELECT id FROM datalookup WHERE value LIKE '%active%' LIMIT 1;").strip()

    if not owner_role_id:
        owner_role_id = run_mysql_query(target_db, "SELECT id FROM role WHERE name = 'Owner' or name = 'Super Admin' LIMIT 1;").strip()
    if not staff_role_id:
        staff_role_id = run_mysql_query(target_db, "SELECT id FROM role WHERE name = 'Staff' LIMIT 1;").strip()
        if not staff_role_id:
            staff_role_id = owner_role_id

    # Password hashes for the 4 INSA accounts
    pass_admin = "$2a$10$XzmOqIT7YW9ok/kh8HilIOmDwiq7/4XhMRyi9wmXdYdLZFBqb7gLm"     # InsaAdmin#2026!Audit
    pass_reviewer = "$2a$10$cfv7ILXJnPIhL5jncLLOcOuYnHnk0UkhETiwFhwxw/25AXW/tbx12"  # InsaReviewer#2026!Audit
    pass_church1 = "$2a$10$EZ999ghJyqySQN.buKyzP.AjFHyt88y8x.DMENGzqIwVAmjqk9Fza"   # InsaChurch1#2026!Audit
    pass_church2 = "$2a$10$KdF4Jr9nYzn2boZhgyVT0.jJomH9uD/nAJl5CjvzquikKDrgU59A6"   # InsaChurch2#2026!Audit

    # Step 3: Fetch church members for INSA church accounts
    members_raw = run_mysql_query(target_db, "SELECT id FROM member ORDER BY created_at ASC;")
    member_ids = [m.strip() for m in members_raw.strip().split("\n") if m.strip()]
    if len(member_ids) < 2:
        print("FATAL: Fewer than 2 members found in staging!")
        sys.exit(1)

    member1_id = member_ids[0]
    member2_id = member_ids[1]

    print(f"    Member 1 (INSA Church 1): {member1_id}")
    print(f"    Member 2 (INSA Church 2): {member2_id}")

    sql_lines = []
    sql_lines.append("SET FOREIGN_KEY_CHECKS = 0;")
    sql_lines.append("START TRANSACTION;")

    # Ensure INSA staff accounts exist and have correct passwords
    if insa_admin_id:
        sql_lines.append(f"""
        UPDATE staff SET
            firstName = 'INSA',
            lastName = 'SuperAdmin',
            fullName = 'INSA Super Admin',
            phoneNumber = '+251911000001',
            password = {escape_sql(pass_admin)},
            stateId = {escape_sql(active_state_id)},
            roleId = {escape_sql(owner_role_id)}
        WHERE id = {escape_sql(insa_admin_id)};
        """)
    else:
        import uuid
        insa_admin_id = str(uuid.uuid4())
        sql_lines.append(f"""
        INSERT INTO staff (id, email, firstName, lastName, fullName, phoneNumber, password, roleId, stateId, created_at, updated_at)
        VALUES ({escape_sql(insa_admin_id)}, 'insa-admin@ecgbc.org', 'INSA', 'SuperAdmin', 'INSA Super Admin', '+251911000001', {escape_sql(pass_admin)}, {escape_sql(owner_role_id)}, {escape_sql(active_state_id)}, NOW(), NOW());
        """)

    if insa_reviewer_id:
        sql_lines.append(f"""
        UPDATE staff SET
            firstName = 'INSA',
            lastName = 'Reviewer',
            fullName = 'INSA Staff Reviewer',
            phoneNumber = '+251911000002',
            password = {escape_sql(pass_reviewer)},
            stateId = {escape_sql(active_state_id)},
            roleId = {escape_sql(staff_role_id)}
        WHERE id = {escape_sql(insa_reviewer_id)};
        """)
    else:
        import uuid
        insa_reviewer_id = str(uuid.uuid4())
        sql_lines.append(f"""
        INSERT INTO staff (id, email, firstName, lastName, fullName, phoneNumber, password, roleId, stateId, created_at, updated_at)
        VALUES ({escape_sql(insa_reviewer_id)}, 'insa-reviewer@ecgbc.org', 'INSA', 'Reviewer', 'INSA Staff Reviewer', '+251911000002', {escape_sql(pass_reviewer)}, {escape_sql(staff_role_id)}, {escape_sql(active_state_id)}, NOW(), NOW());
        """)

    # Ensure INSA church users exist and have correct passwords
    sql_lines.append(f"""
    INSERT INTO churchuser (id, email, firstName, lastName, phone, password, role, isActive, memberId, created_at, updated_at)
    VALUES (UUID(), 'insa-church1@ecgbc.org', 'INSA', 'ChurchAlpha', '+251911000003', {escape_sql(pass_church1)}, 'ADMIN', 1, {escape_sql(member1_id)}, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        firstName = 'INSA',
        lastName = 'ChurchAlpha',
        phone = '+251911000003',
        password = {escape_sql(pass_church1)},
        role = 'ADMIN',
        isActive = 1,
        memberId = {escape_sql(member1_id)};
    """)

    sql_lines.append(f"""
    INSERT INTO churchuser (id, email, firstName, lastName, phone, password, role, isActive, memberId, created_at, updated_at)
    VALUES (UUID(), 'insa-church2@ecgbc.org', 'INSA', 'ChurchBeta', '+251911000004', {escape_sql(pass_church2)}, 'ADMIN', 1, {escape_sql(member2_id)}, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        firstName = 'INSA',
        lastName = 'ChurchBeta',
        phone = '+251911000004',
        password = {escape_sql(pass_church2)},
        role = 'ADMIN',
        isActive = 1,
        memberId = {escape_sql(member2_id)};
    """)

    # Reassign FKs pointing to staff
    print("[*] Generating FK reassignment queries...")
    sql_lines.append(f"UPDATE actionstate SET performedBy = {escape_sql(insa_admin_id)} WHERE performedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE namereservation SET requestedBy = {escape_sql(insa_admin_id)} WHERE requestedBy IS NOT NULL AND requestedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE namereservation SET reviewedBy = {escape_sql(insa_admin_id)} WHERE reviewedBy IS NOT NULL AND reviewedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE registrationrequest SET reviewedBy = {escape_sql(insa_admin_id)} WHERE reviewedBy IS NOT NULL AND reviewedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE memberlineage SET performedBy = {escape_sql(insa_admin_id)} WHERE performedBy IS NOT NULL AND performedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE membertransfer SET performedBy = {escape_sql(insa_admin_id)} WHERE performedBy IS NOT NULL AND performedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE memberclosurerequest SET reviewedBy = {escape_sql(insa_admin_id)} WHERE reviewedBy IS NOT NULL AND reviewedBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"UPDATE apikey SET createdBy = {escape_sql(insa_admin_id)} WHERE createdBy IS NOT NULL AND createdBy NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")
    sql_lines.append(f"DELETE FROM stafffellowship WHERE staffId NOT IN ({escape_sql(insa_admin_id)}, {escape_sql(insa_reviewer_id)});")

    # Delete real staff and church user accounts
    print("[*] Generating account purge queries...")
    sql_lines.append("DELETE FROM staff WHERE email NOT IN ('insa-admin@ecgbc.org', 'insa-reviewer@ecgbc.org');")
    sql_lines.append("DELETE FROM churchuser WHERE email NOT IN ('insa-church1@ecgbc.org', 'insa-church2@ecgbc.org');")

    # Clean activity and actionstate notes
    print("[*] Generating activity log and action state sanitization...")
    sql_lines.append("TRUNCATE TABLE activity;")
    sql_lines.append("UPDATE actionstate SET note = 'Staging audit verification note' WHERE note IS NOT NULL;")

    # Council Fellowships
    print("[*] Generating council fellowship sanitization...")
    councils_raw = run_mysql_query(target_db, "SELECT id FROM councilfellowship ORDER BY id ASC;")
    councils = [c.strip() for c in councils_raw.strip().split("\n") if c.strip()]
    for idx, c_id in enumerate(councils, 1):
        sql_lines.append(f"""
        UPDATE councilfellowship SET
            phoneNumber = '+251911000000',
            email = 'fellowship{idx:02d}@staging.ecgbc.org',
            houseNumber = 'H-01',
            poBoxNumber = 'P.O. Box 1000',
            description = 'Staging Verified Council Fellowship'
        WHERE id = {escape_sql(c_id)};
        """)

    # Contact Persons
    sql_lines.append("""
    UPDATE contactperson SET
        fullName = 'የሙከራ ተወካይ',
        phoneNumber = '+251911000000',
        email = 'contact@staging.ecgbc.org';
    """)

    # Members (4,060 churches)
    print(f"[*] Generating synthetic records for {len(member_ids)} member churches...")
    sql_lines.append("DROP TEMPORARY TABLE IF EXISTS tmp_member_anon;")
    sql_lines.append("""
    CREATE TEMPORARY TABLE tmp_member_anon (
        id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
        new_name VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_name_en VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_cert VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_phone VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_email VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_house VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_pobox VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    batch_size = 500
    for i in range(0, len(member_ids), batch_size):
        chunk = member_ids[i:i + batch_size]
        vals = []
        for j, m_id in enumerate(chunk):
            idx = i + j + 1
            denom_am, denom_en = DENOMINATIONS[idx % len(DENOMINATIONS)]
            loc_am, loc_en = LOCALITIES[idx % len(LOCALITIES)]

            # Specially name Church 1 & 2 for clear identification in INSA testing
            if m_id == member1_id:
                name_am = "የኢትዮጵያ ሙሉ ወንጌል አማኞች ቤተክርስቲያን - መገናኛ አጥቢያ (INSA ሙከራ 1)"
                name_en = "Ethiopian Full Gospel Believers Church - Megenagna Assembly (INSA Audit Church Alpha)"
                cert_no = "STG-00001"
            elif m_id == member2_id:
                name_am = "የኢትዮጵያ ቃለ ሕይወት ቤተክርስቲያን - ቦሌ አጥቢያ (INSA ሙከራ 2)"
                name_en = "Ethiopian Kale Heywet Church - Bole Assembly (INSA Audit Church Beta)"
                cert_no = "STG-00002"
            else:
                name_am = f"{denom_am} - {loc_am} (ተ.ቁ {idx:04d})"
                name_en = f"{denom_en} - {loc_en} (No. {idx:04d})"
                cert_no = f"STG-{idx:05d}"

            phone = f"+2519110000{idx % 100:02d}"
            email = f"church{idx:04d}@staging.ecgbc.org"
            house = f"H-{(idx % 500) + 1}"
            pobox = f"P.O. Box {(idx % 2000) + 1000}"

            vals.append(f"({escape_sql(m_id)}, {escape_sql(name_am)}, {escape_sql(name_en)}, {escape_sql(cert_no)}, {escape_sql(phone)}, {escape_sql(email)}, {escape_sql(house)}, {escape_sql(pobox)})")

        sql_lines.append(f"INSERT INTO tmp_member_anon (id, new_name, new_name_en, new_cert, new_phone, new_email, new_house, new_pobox) VALUES {','.join(vals)};")

    sql_lines.append("""
    UPDATE member m
    JOIN tmp_member_anon t ON m.id = t.id
    SET
        m.name = t.new_name,
        m.nameEn = t.new_name_en,
        m.certificateNo = t.new_cert,
        m.phoneNumber = t.new_phone,
        m.email = t.new_email,
        m.houseNumber = t.new_house,
        m.poBoxNumber = t.new_pobox,
        m.reasonForInactive = CASE WHEN m.reasonForInactive IS NOT NULL THEN 'Staging test inactive record' ELSE NULL END;
    """)
    sql_lines.append("DROP TEMPORARY TABLE IF EXISTS tmp_member_anon;")

    # Board Members (21,091 records)
    print("[*] Retrieving board member IDs...")
    bm_raw = run_mysql_query(target_db, "SELECT id FROM boardmember ORDER BY id ASC;")
    bm_ids = [b.strip() for b in bm_raw.strip().split("\n") if b.strip()]
    print(f"[*] Generating synthetic records for {len(bm_ids)} board members...")

    sql_lines.append("DROP TEMPORARY TABLE IF EXISTS tmp_bm_anon;")
    sql_lines.append("""
    CREATE TEMPORARY TABLE tmp_bm_anon (
        id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci PRIMARY KEY,
        new_full_name VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_full_name_en VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        new_phone VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """)

    for i in range(0, len(bm_ids), batch_size):
        chunk = bm_ids[i:i + batch_size]
        vals = []
        for j, b_id in enumerate(chunk):
            idx = i + j + 1
            f_am, f_en = FIRST_NAMES[idx % len(FIRST_NAMES)]
            l_am, l_en = LAST_NAMES[(idx * 7) % len(LAST_NAMES)]
            fn_am = f"{f_am} {l_am}"
            fn_en = f"{f_en} {l_en}"
            phone = f"+2519110000{idx % 100:02d}"
            vals.append(f"({escape_sql(b_id)}, {escape_sql(fn_am)}, {escape_sql(fn_en)}, {escape_sql(phone)})")

        sql_lines.append(f"INSERT INTO tmp_bm_anon (id, new_full_name, new_full_name_en, new_phone) VALUES {','.join(vals)};")

    sql_lines.append("""
    UPDATE boardmember b
    JOIN tmp_bm_anon t ON b.id = t.id
    SET
        b.fullName = t.new_full_name,
        b.fullNameEn = t.new_full_name_en,
        b.phoneNumber = t.new_phone;
    """)
    sql_lines.append("DROP TEMPORARY TABLE IF EXISTS tmp_bm_anon;")

    # Reports (13,887 records)
    print("[*] Masking reports & reporting fees...")
    sql_lines.append("""
    UPDATE report SET
        bankReference = CONCAT('TXN-STG-', LPAD(CRC32(id) % 1000000, 6, '0')),
        crv = CASE WHEN crv IS NOT NULL THEN CONCAT('CRV-STG-', LPAD(CRC32(id) % 1000000, 6, '0')) ELSE NULL END,
        file = CASE WHEN file IS NOT NULL THEN 'sample-report.pdf' ELSE NULL END,
        remark = 'Staging verified audit report';
    """)

    sql_lines.append("""
    UPDATE reportingfee SET
        crv = CASE WHEN crv IS NOT NULL THEN CONCAT('CRV-STG-', LPAD(CRC32(id) % 1000000, 6, '0')) ELSE NULL END,
        note = 'Staging fee record';
    """)

    # Files (8,456 records)
    print("[*] Decoupling file attachments to sample-document.pdf...")
    sql_lines.append("""
    UPDATE file SET
        fileName = 'sample-document.pdf',
        file = 'sample-document.pdf';
    """)

    # Name Reservations
    print("[*] Masking name reservations...")
    sql_lines.append("""
    UPDATE namereservation SET
        requestedNameAm = CONCAT('የሙከራ ቤተክርስቲያን ስም ማስያዣ ', SUBSTRING(id, 1, 8)),
        requestedNameEn = CONCAT('Staging Test Name Reservation ', SUBSTRING(id, 1, 8)),
        proposedNames = '[]',
        publicRequesterName = 'INSA Auditor',
        publicRequesterEmail = 'insa-audit@staging.ecgbc.org',
        publicRequesterPhone = '+251911000099',
        similarityData = NULL,
        remark = 'Staging name reservation for security audit testing';
    """)

    # Registration Requests & Transfers & Closures (if any exist)
    sql_lines.append("""
    UPDATE registrationrequest SET
        nameAm = CONCAT('የአዲስ ምዝገባ ሙከራ ', SUBSTRING(id, 1, 8)),
        nameEn = CONCAT('Staging Registration Request ', SUBSTRING(id, 1, 8)),
        phoneNumber = '+251911000000',
        email = 'request@staging.ecgbc.org',
        contactPersonName = 'የሙከራ ተወካይ',
        contactPersonPhone = '+251911000000',
        contactPersonEmail = 'request@staging.ecgbc.org';
    """)

    sql_lines.append("""
    UPDATE memberclosurerequest SET
        contactPersonName = 'የሙከራ ተወካይ',
        contactPersonPhone = '+251911000000',
        contactPersonEmail = 'closure@staging.ecgbc.org',
        resolutionDocumentUrl = 'sample-document.pdf';
    """)

    sql_lines.append("""
    UPDATE membertransfer SET
        referenceNumber = CONCAT('TRF-STG-', SUBSTRING(id, 1, 8)),
        documentUrl = 'sample-document.pdf';
    """)

    sql_lines.append("COMMIT;")
    sql_lines.append("SET FOREIGN_KEY_CHECKS = 1;")

    script_path = "/tmp/run_staging_sanitization.sql"
    print(f"[*] Writing SQL batch script ({len(sql_lines)} statements) to {script_path}...")
    with open(script_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))

    print("[*] Executing batch sanitization in ecgbc-db MySQL...")
    run_mysql_script(target_db, script_path)
    print("    Sanitization executed successfully!")

    # Step 4: Verification and Summary Report
    print("\n=================================================================")
    print("   STAGING SANITIZATION AUDIT & VERIFICATION RECORD")
    print("=================================================================\n")

    m_cnt = run_mysql_query(target_db, "SELECT count(*) FROM member;").strip()
    bm_cnt = run_mysql_query(target_db, "SELECT count(*) FROM boardmember;").strip()
    r_cnt = run_mysql_query(target_db, "SELECT count(*) FROM report;").strip()
    f_cnt = run_mysql_query(target_db, "SELECT count(*) FROM file;").strip()
    s_cnt = run_mysql_query(target_db, "SELECT count(*) FROM staff;").strip()
    cu_cnt = run_mysql_query(target_db, "SELECT count(*) FROM churchuser;").strip()
    act_cnt = run_mysql_query(target_db, "SELECT count(*) FROM activity;").strip()

    print(f"Member churches:        {m_cnt}")
    print(f"Board members:          {bm_cnt}")
    print(f"Annual reports:         {r_cnt}")
    print(f"Files:                  {f_cnt}")
    print(f"Staff logins remaining: {s_cnt} (Expected: 2)")
    print(f"Church logins remaining:{cu_cnt} (Expected: 2)")
    print(f"Activity audit logs:    {act_cnt} (Expected: 0)")

    print("\nRemaining Staff Accounts in ecgbc_staging:")
    staff_rows = run_mysql_query(target_db, "SELECT email, firstName, lastName, phoneNumber FROM staff;")
    for r in staff_rows.strip().split("\n"):
        print("  - " + r)

    print("\nRemaining Church User Accounts in ecgbc_staging:")
    cu_rows = run_mysql_query(target_db, "SELECT email, firstName, lastName, phone FROM churchuser;")
    for r in cu_rows.strip().split("\n"):
        print("  - " + r)

    print("\nSample Anonymized Members:")
    samp_members = run_mysql_query(target_db, "SELECT name, nameEn, certificateNo, phoneNumber, email FROM member LIMIT 3;")
    for r in samp_members.strip().split("\n"):
        print("  - " + r)

    print("\nSample Anonymized Board Members:")
    samp_bm = run_mysql_query(target_db, "SELECT fullName, fullNameEn, phoneNumber FROM boardmember LIMIT 3;")
    for r in samp_bm.strip().split("\n"):
        print("  - " + r)

    print("\nSample Anonymized Reports:")
    samp_rep = run_mysql_query(target_db, "SELECT bankReference, crv, file FROM report LIMIT 3;")
    for r in samp_rep.strip().split("\n"):
        print("  - " + r)

    print("\nSample Anonymized Files:")
    samp_files = run_mysql_query(target_db, "SELECT fileName, file FROM file LIMIT 3;")
    for r in samp_files.strip().split("\n"):
        print("  - " + r)

    print("\n[+] Sanitization & Anonymization COMPLETE!")

if __name__ == "__main__":
    main()
