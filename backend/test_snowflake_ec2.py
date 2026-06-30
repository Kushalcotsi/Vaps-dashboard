import os
import sys
import urllib.request
import traceback

# Add current folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(".env")

from app.core.config import settings
import snowflake.connector

def get_public_ip():
    try:
        url = "https://api.ipify.org"
        with urllib.request.urlopen(url, timeout=5) as response:
            return response.read().decode("utf-8")
    except Exception as e:
        return f"Unable to fetch public IP: {e}"

def test_connection():
    print("==================================================")
    print("SNOWFLAKE CONNECTION DIAGNOSTIC")
    print("==================================================")
    
    # 1. Fetch and print public IP
    public_ip = get_public_ip()
    print(f"Current Server Public IP: {public_ip}")
    print("Make sure this EXACT IP is whitelisted in your Snowflake Network Policy.")
    print("--------------------------------------------------")
    
    # 2. Print configured settings (hiding password)
    print("Connection Settings:")
    print(f"  User: {settings.SNOWFLAKE_USER}")
    print(f"  Account: {settings.SNOWFLAKE_ACCOUNT}")
    print(f"  Warehouse: {settings.SNOWFLAKE_WAREHOUSE}")
    print(f"  Database: {settings.SNOWFLAKE_DATABASE}")
    print(f"  Schema: {settings.SNOWFLAKE_SCHEMA}")
    print(f"  Role: {settings.SNOWFLAKE_ROLE}")
    print(f"  Authenticator: {settings.SNOWFLAKE_AUTHENTICATOR}")
    print(f"  Password length: {len(settings.SNOWFLAKE_PASSWORD) if settings.SNOWFLAKE_PASSWORD else 0}")
    print("--------------------------------------------------")
    
    conn_args = {
        "user": settings.SNOWFLAKE_USER.upper(),
        "account": "hz83093.us-east-1",
        "authenticator": settings.SNOWFLAKE_AUTHENTICATOR,
        "private_key_file": settings.SNOWFLAKE_PRIVATE_KEY_PATH,
        "private_key_file_pwd":settings.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE, 
        "host": "hz83093.us-east-1.snowflakecomputing.com",
        "warehouse": settings.SNOWFLAKE_WAREHOUSE,
        "database": settings.SNOWFLAKE_DATABASE,
#        "schema": settings.SNOWFLAKE_SCHEMA,
#        "role": settings.SNOWFLAKE_ROLE,
        "login_timeout": 15,
        "network_timeout": 15,
        "socket_timeout": 15
    }
    
    authenticator = (settings.SNOWFLAKE_AUTHENTICATOR or "snowflake").lower()
    
    if authenticator == "externalbrowser":
        print("Using authenticator: externalbrowser (WARNING: This will hang in a headless environment!)")
        conn_args["authenticator"] = "externalbrowser"
    elif authenticator == "SNOWFLAKE_JWT" or settings.SNOWFLAKE_PRIVATE_KEY_PATH:
        print(f"Using authenticator: keypair (loading from {settings.SNOWFLAKE_PRIVATE_KEY_PATH})...")
        try:
            from cryptography.hazmat.primitives import serialization
            with open(settings.SNOWFLAKE_PRIVATE_KEY_PATH, "rb") as key_file:
                passphrase = settings.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE.encode() if settings.SNOWFLAKE_PRIVATE_KEY_PASSPHRASE else None
                private_key = serialization.load_pem_private_key(key_file.read(), password=passphrase)
            private_key_bytes = private_key.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
#            conn_args["private_key"] = private_key_bytes
        except Exception as e:
            print(f"❌ Error loading private key: {e}")
            return
    else:
        print("Using authenticator: standard database username/password")
        conn_args["password"] = settings.SNOWFLAKE_PASSWORD
        if settings.SNOWFLAKE_AUTHENTICATOR and settings.SNOWFLAKE_AUTHENTICATOR.lower() != "snowflake":
            conn_args["authenticator"] = settings.SNOWFLAKE_AUTHENTICATOR

    # 3. Attempt Connection
    try:
        print("Attempting to connect to Snowflake...")
        print(conn_args)
        conn = snowflake.connector.connect(**conn_args)
        print("✅ SUCCESS! Snowflake connection established successfully.")
        
        # Test basic query
        with conn.cursor() as cur:
            cur.execute("SELECT CURRENT_VERSION()")
            version = cur.fetchone()[0]
            print(f"Database version: {version}")
        conn.close()
    except Exception as e:
        print("\n❌ CONNECTION FAILED:")
        traceback.print_exc()
        print("\nPossible Causes:")
        if "Incoming request with IP" in str(e):
            print(" -> IP Whitelist restriction. The public IP listed above is not allowed by the Snowflake Network Policy.")
        elif "Incorrect username or password" in str(e) or "Authentication failed" in str(e):
            print(" -> Authentication credentials error. Check your username, password, or role permissions.")
            print(" -> Note: If your Snowflake account uses SSO/Federated login, standard password auth may not be supported for your user; you may need to use Key-Pair auth instead.")
        elif "Timeout" in str(e) or "connect timed out" in str(e):
            print(" -> Network timeout. Check that ports and outgoing connections to Snowflake are not blocked by a firewall.")

if __name__ == "__main__":
    test_connection()
