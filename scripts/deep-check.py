#!/usr/bin/env python3
import subprocess
import json

def q(db, sql):
    res = subprocess.run(
        ["docker", "exec", "ecgbc-db", "mysql", "-uecgbc_user", "-pecgbc_password123", db, "-N", "-e", sql],
        capture_output=True,
        text=True
    )
    if res.returncode != 0:
        return f"ERR: {res.stderr.strip()}"
    return res.stdout.strip()

print("=== CHECKING ALL TABLES IN ecgbc_staging ===")

tables = q("ecgbc_staging", "SHOW TABLES;").split("\n")
print(f"Total tables: {len(tables)}")
for t in tables:
    t = t.strip()
    if not t:
        continue
    cnt = q("ecgbc_staging", f"SELECT count(*) FROM `{t}`;")
    print(f"Table {t}: {cnt} rows")

print("\n=== CHECKING SENSITIVE COLUMNS IN ecgbc_staging ===")

email_cols = [
    ("member", "email"),
    ("churchuser", "email"),
    ("staff", "email"),
    ("councilfellowship", "email"),
    ("contactperson", "email"),
    ("registrationrequest", "email"),
    ("registrationrequest", "contactPersonEmail"),
    ("memberclosurerequest", "contactPersonEmail"),
    ("namereservation", "publicRequesterEmail")
]

for tbl, col in email_cols:
    cnt = q("ecgbc_staging", f"SELECT count(*) FROM `{tbl}` WHERE `{col}` IS NOT NULL AND `{col}` != '' AND `{col}` NOT LIKE '%@staging.ecgbc.org' AND `{col}` NOT LIKE '%@ecgbc.org';")
    sample = q("ecgbc_staging", f"SELECT DISTINCT `{col}` FROM `{tbl}` LIMIT 3;")
    print(f"{tbl}.{col} non-dummy count: {cnt} (sample: {sample.replace(chr(10), ', ')})")

phone_cols = [
    ("member", "phoneNumber"),
    ("boardmember", "phoneNumber"),
    ("churchuser", "phone"),
    ("staff", "phoneNumber"),
    ("councilfellowship", "phoneNumber"),
    ("contactperson", "phoneNumber"),
    ("registrationrequest", "phoneNumber"),
    ("registrationrequest", "contactPersonPhone"),
    ("memberclosurerequest", "contactPersonPhone"),
    ("namereservation", "publicRequesterPhone")
]

for tbl, col in phone_cols:
    cnt = q("ecgbc_staging", f"SELECT count(*) FROM `{tbl}` WHERE `{col}` IS NOT NULL AND `{col}` != '' AND `{col}` NOT LIKE '+2519110000%';")
    sample = q("ecgbc_staging", f"SELECT DISTINCT `{col}` FROM `{tbl}` LIMIT 3;")
    print(f"{tbl}.{col} non-dummy count: {cnt} (sample: {sample.replace(chr(10), ', ')})")

print("\n=== CHECKING COUNCIL FELLOWSHIP NAMES ===")
cf_sample = q("ecgbc_staging", "SELECT id, name, description FROM councilfellowship LIMIT 5;")
print(f"Council Fellowship sample:\n{cf_sample}")

print("\n=== CHECKING PAYMENT METHOD CONFIGS ===")
pmc = q("ecgbc_staging", "SELECT * FROM paymentmethodconfig;")
print(f"Payment method configs:\n{pmc}")

print("\n=== CHECKING API KEYS ===")
ak = q("ecgbc_staging", "SELECT id, name, keyPrefix, createdBy FROM apikey;")
print(f"Api keys:\n{ak}")

print("\n=== CHECKING ACTION STATE NOTES ===")
asn = q("ecgbc_staging", "SELECT count(*) FROM actionstate WHERE note IS NOT NULL AND note NOT LIKE '%Staging%';")
print(f"Unsanitized actionstate notes: {asn}")

print("\n=== CHECKING MEMBER CLOSURE REQUESTS ===")
mcr = q("ecgbc_staging", "SELECT count(*) FROM memberclosurerequest WHERE reason NOT LIKE '%Staging%' OR recordsLocation IS NOT NULL;")
print(f"Member closure requests: {mcr}")

print("\n=== CHECKING REGISTRATION REQUEST REMARKS ===")
rrr = q("ecgbc_staging", "SELECT count(*) FROM registrationrequest WHERE remark IS NOT NULL AND remark NOT LIKE '%Staging%';")
print(f"Registration request remarks: {rrr}")

print("\n=== CHECKING MEMBER ADDRESSES / LOCATIONS ===")
m_addr = q("ecgbc_staging", "SELECT city, subcity, zone, district FROM member WHERE city IS NOT NULL LIMIT 5;")
print(f"Member addresses sample:\n{m_addr}")

print("\n=== CHECKING BOARD MEMBER PHOTOS / TITLES ===")
bm_sample = q("ecgbc_staging", "SELECT fullName, fullNameEn, phoneNumber FROM boardmember LIMIT 5;")
print(f"Board member sample:\n{bm_sample}")

print("\n=== CHECKING REPORT REMARKS / REFERENCES ===")
rep_sample = q("ecgbc_staging", "SELECT id, year, bankReference, crv, file, remark FROM report LIMIT 5;")
print(f"Report sample:\n{rep_sample}")
