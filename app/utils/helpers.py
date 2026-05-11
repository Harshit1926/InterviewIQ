import uuid

# In-memory session store
# stores all active interview sessions
# key = session_id, value = session data dictionary
sessions = {}

def generate_session_id():
    return str(uuid.uuid4())