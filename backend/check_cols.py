import os
from dotenv import load_dotenv
import snowflake.connector
from cryptography.hazmat.primitives import serialization

load_dotenv()

with open("rsa_key.p8", "rb") as key_file:
    passphrase = os.getenv("SNOWFLAKE_PRIVATE_KEY_PASSPHRASE")
    p_key = serialization.load_pem_private_key(
        key_file.read(),
        password=passphrase.encode() if passphrase else None
    )
pkb = p_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

conn = snowflake.connector.connect(
    user=os.getenv("SNOWFLAKE_USER"),
    account=os.getenv("SNOWFLAKE_ACCOUNT"),
    warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
    database=os.getenv("SNOWFLAKE_DATABASE"),
    schema=os.getenv("SNOWFLAKE_SCHEMA"),
    role=os.getenv("SNOWFLAKE_ROLE"),
    private_key=pkb
)

cur = conn.cursor()
print("--- DIVISION VIEW COLUMNS ---")
cur.execute("DESCRIBE VIEW gs_unit_vaps_attach_rate_division")
for row in cur.fetchall():
    print(row[0])

print("\n--- REGION VIEW COLUMNS ---")
cur.execute("DESCRIBE VIEW gs_unit_vaps_attach_rate_region")
for row in cur.fetchall():
    print(row[0])
