
"""
Citrix Terminal Debug Script for Snowflake Unit Market Segment Data
Run this in terminal: python3 debug_snowflake_unit_market.py
"""
import os
import sys
import traceback
from dotenv import load_dotenv

def main():
    print("=================================================================")
    print("1. LOADING ENV AND CONNECTING TO SNOWFLAKE...")
    print("=================================================================")
    load_dotenv()
    
    try:
        import snowflake.connector
    except ImportError:
        print("❌ ERROR: snowflake-connector-python is not installed.")
        return

    conn_args = {
        "user": os.getenv("SNOWFLAKE_USER"),
        "account": os.getenv("SNOWFLAKE_ACCOUNT"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
        "database": os.getenv("SNOWFLAKE_DATABASE", "AI_AGENT_LOGS"),
        "schema": os.getenv("SNOWFLAKE_SCHEMA", "TEST"),
        "role": os.getenv("SNOWFLAKE_ROLE"),
    }

    # Handle keypair auth if present
    private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")
    if private_key_path and os.path.exists(private_key_path):
        from cryptography.hazmat.primitives import serialization
        with open(private_key_path, "rb") as key_file:
            passphrase = os.getenv("SNOWFLAKE_PRIVATE_KEY_PASSPHRASE")
            passphrase_bytes = passphrase.encode() if passphrase else None
            private_key = serialization.load_pem_private_key(
                key_file.read(),
                password=passphrase_bytes
            )
        pk_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        conn_args["private_key"] = pk_bytes
    else:
        password = os.getenv("SNOWFLAKE_PASSWORD")
        if password:
            conn_args["password"] = password
        auth = os.getenv("SNOWFLAKE_AUTHENTICATOR")
        if auth and auth.lower() not in ("keypair", "snowflake"):
            conn_args["authenticator"] = auth

    db = conn_args["database"]
    schema = conn_args["schema"]
    view_name = f"{db}.{schema}.GS_UNIT_MARKET_SEGMENT_ATTACH_RATE"

    try:
        conn = snowflake.connector.connect(**conn_args)
        print("✅ Successfully connected to Snowflake!")
    except Exception as e:
        print(f"❌ Failed to connect to Snowflake: {e}")
        return

    print("\n=================================================================")
    print(f"2. QUERYING VIEW: {view_name}")
    print("=================================================================")
    try:
        cur = conn.cursor(snowflake.connector.DictCursor)
        cur.execute(f"SELECT * FROM {view_name}")
        raw_rows = cur.fetchall()
        print(f"✅ Total rows returned by Snowflake view: {len(raw_rows):,}")
    except Exception as e:
        print(f"❌ Failed to query {view_name}: {e}")
        return

    if not raw_rows:
        print("⚠️ No rows returned by Snowflake view!")
        return

    first_row = raw_rows[0]
    print("\n-----------------------------------------------------------------")
    print(f"3. COLUMNS IN VIEW ({len(first_row)} total):")
    print("-----------------------------------------------------------------")
    for col in first_row.keys():
        print(f" - {col}: {first_row[col]}")

    print("\n=================================================================")
    print("4. TESTING RECOMMENDATION ENGINE TRANSFORMATION ON SNOWFLAKE DATA")
    print("=================================================================")
    try:
        import pandas as pd
        for rel_path in [".", "..", "../..", "../../..", "../../../.."]:
            candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), rel_path))
            if os.path.exists(os.path.join(candidate, "build_recommendation_report.py")) and candidate not in sys.path:
                sys.path.insert(0, candidate)
                print(f"Found build_recommendation_report.py in: {candidate}")
                break

        from build_recommendation_report import (
            prepare_schema,
            calculate_time_aware_features,
            build_latest_recommendations,
        )

        print("Converting Snowflake rows to DataFrame...")
        df = pd.DataFrame(raw_rows)
        print(f"Initial DataFrame Shape: {df.shape}")

        print("\nRunning prepare_schema()...")
        df, schema_obj = prepare_schema(df)
        print("✅ prepare_schema succeeded! Standardized columns:")
        print(list(df.columns[:15]), "...")

        # Check if recommendation_score is present and populated
        if "recommendation_score" not in df.columns or df["recommendation_score"].isna().all() or (df["recommendation_score"] == 0).all():
            print("\nrecommendation_score is missing or 0. Running calculate_time_aware_features()...")
            df = calculate_time_aware_features(df, schema_obj)
            print("✅ calculate_time_aware_features succeeded!")
        else:
            print("\nrecommendation_score is already populated in Snowflake!")

        print("\nRunning build_latest_recommendations()...")
        latest_df = build_latest_recommendations(df, schema_obj)
        print(f"✅ build_latest_recommendations succeeded!")
        print(f" -> LATEST PERIOD ROWS: {len(latest_df):,}")
        print(f" -> TOP REC SCORE: {latest_df['recommendation_score'].max():.4f}")
        print(f" -> AVG REC SCORE: {latest_df['recommendation_score'].mean():.4f}")
        print(f" -> MAX MOMENTUM:  {latest_df['momentum_score'].max():.4f}")

    except Exception as e:
        print("\n❌ TRANSFORMATION ERROR:")
        traceback.print_exc()

if __name__ == "__main__":
    main()
