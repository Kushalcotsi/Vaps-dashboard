import os
import sys
from dotenv import load_dotenv
import snowflake.connector

def fix_view():
    load_dotenv()
    
    conn_args = {
        "user": os.getenv("SNOWFLAKE_USER"),
        "account": os.getenv("SNOWFLAKE_ACCOUNT"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
        "database": os.getenv("SNOWFLAKE_DATABASE"),
        "schema": os.getenv("SNOWFLAKE_SCHEMA"),
        "role": os.getenv("SNOWFLAKE_ROLE"),
    }

    # Handle Keypair authentication
    private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
    if private_key_path and os.path.exists(private_key_path):
        from cryptography.hazmat.primitives import serialization
        print(f"Loading private key from {private_key_path}...")
        with open(private_key_path, "rb") as key_file:
            passphrase = os.getenv("SNOWFLAKE_PRIVATE_KEY_PASSPHRASE")
            passphrase_bytes = passphrase.encode() if passphrase else None
            private_key = serialization.load_pem_private_key(
                key_file.read(),
                password=passphrase_bytes
            )
            
        private_key_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        conn_args["private_key"] = private_key_bytes
    else:
        # Fallback to password or external browser
        password = os.getenv("SNOWFLAKE_PASSWORD")
        if password:
            conn_args["password"] = password
        
        auth = os.getenv("SNOWFLAKE_AUTHENTICATOR")
        if auth and auth.lower() not in ("keypair", "snowflake"):
            conn_args["authenticator"] = auth

    print("Connecting to Snowflake...")
    try:
        conn = snowflake.connector.connect(**conn_args)
        cur = conn.cursor(snowflake.connector.DictCursor)
        
        # We need to fix 4 views in order since they might depend on each other.
        # But the main one is GS_SALES_ACTIVATION_VIEW. Let's fix that one first.
        views_to_fix = [
            "AI_AGENT_LOGS.TEST.GS_SALES_ACTIVATION_VIEW",
            "AI_AGENT_LOGS.TEST.gs_unit_vaps_attach_rate_new",
            "AI_AGENT_LOGS.TEST.gs_unit_market_segment_vaps_attach_rate_new",
            "AI_AGENT_LOGS.TEST.gs_unit_vaps_attach_rate_division_new",
            "AI_AGENT_LOGS.TEST.gs_unit_vaps_attach_rate_region_new"
        ]
        
        for view_name in views_to_fix:
            print(f"\n--- Processing view: {view_name} ---")
            try:
                cur.execute(f"SELECT GET_DDL('VIEW', '{view_name}')")
                row = cur.fetchone()
                ddl = list(row.values())[0] if row else None
                
                if not ddl:
                    print(f"Could not fetch DDL for {view_name}")
                    continue
                
                # Fix the DDL: Remove the explicit column list so Snowflake derives it directly from the SELECT *
                import re
                # This regex finds the explicit column list (...) before the "as" keyword and removes it
                fixed_ddl = re.sub(r'(create\s+or\s+replace\s+view\s+[^\(]+?)\s*\([^)]+\)\s+as\b', r'\1 as', ddl, flags=re.IGNORECASE)
                
                print("Recreating it to fix column mismatch...")
                cur.execute(fixed_ddl)
                print(f"Successfully recreated {view_name}!")
                
            except Exception as e:
                print(f"Error processing {view_name}: {str(e)}")
                
    except Exception as e:
        print(f"Connection failed: {str(e)}")
        sys.exit(1)
        
    print("\nAll views processed.")

if __name__ == "__main__":
    fix_view()
