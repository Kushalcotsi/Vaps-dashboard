import os
from dotenv import load_dotenv
import snowflake.connector
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization

# Load environment variables
load_dotenv()

key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
passphrase = os.getenv("SNOWFLAKE_PRIVATE_KEY_PASSPHRASE")

# Load private key
with open(key_path, "rb") as key_file:
    p_key = serialization.load_pem_private_key(
        key_file.read(),
        password=passphrase.encode() if passphrase else None,
        backend=default_backend()
    )

pkb = p_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

# Connect to Snowflake
print("Connecting to Snowflake...")
conn = snowflake.connector.connect(
    user=os.getenv("SNOWFLAKE_USER"),
    account=os.getenv("SNOWFLAKE_ACCOUNT"),
    warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
    database=os.getenv("SNOWFLAKE_DATABASE"),
    schema=os.getenv("SNOWFLAKE_SCHEMA"),
    role=os.getenv("SNOWFLAKE_ROLE"),
    private_key=pkb
)

cursor = conn.cursor()
view_name = "AI_AGENT_LOGS.TEST.GS_SALES_ACTIVATION_VIEW"

try:
    print(f"1. Fetching current DDL for {view_name}...")
    cursor.execute(f"SELECT GET_DDL('view', '{view_name}')")
    ddl = cursor.fetchone()[0]
    print("2. Recompiling the view to include the new columns...")
    cursor.execute(ddl)
    print("✅ View successfully recompiled! PM2 Backend should now work.")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    cursor.close()
    conn.close()
