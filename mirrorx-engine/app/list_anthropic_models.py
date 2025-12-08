from dotenv import load_dotenv
import os
import sys
import traceback
load_dotenv()
print('ANTHROPIC_API_KEY set:', bool(os.getenv('ANTHROPIC_API_KEY')))

try:
    from mirrorcore import anthropic_client
except Exception:
    traceback.print_exc()
    sys.exit(2)

print('anthropic_client configured:', anthropic_client is not None)

try:
    # Try common SDK method to list models
    models = None
    if hasattr(anthropic_client, 'models') and hasattr(anthropic_client.models, 'list'):
        models = anthropic_client.models.list()
    elif hasattr(anthropic_client, 'list_models'):
        models = anthropic_client.list_models()
    else:
        print('No known list models method on client. Client dir:')
        print([a for a in dir(anthropic_client) if not a.startswith('_')])

    print('Models result:', models)
except Exception:
    print('Listing models failed:')
    traceback.print_exc()
    sys.exit(1)
