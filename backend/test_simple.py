import snowflake.connector
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

with open('/home/ubuntu/Vaps-dashboard/backend/rsa_key.p8', 'rb') as key_file:
    p_key = serialization.load_pem_private_key(
        key_file.read(),
        password=rb'1eB~k3\2Y=PAV(Q/',
        backend=default_backend()
    )

pkb = p_key.private_bytes(
    encoding=serialization.Encoding.DER,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)

ctx = snowflake.connector.connect(
    account='ULTDTDU-HZ83093',
    user='SVC_ACCT_PYTHON_CONNECTOR',
    authenticator='snowflake_jwt',
    private_key=pkb,
    warehouse='AI_AGENT_LOGS_WH',
    database='AI_AGENT_LOGS',
    schema='TEST',
    role='DW_SVC_ACCT_PYTHON_QA'
)
print ("connection success")
