"""Exercise the render-only resolver without initializing Pyodide."""
import ast
from copy import deepcopy
from pathlib import Path

source = Path(__file__).parents[1] / 'src/features/viewer/yaml_to_typst.py'
function = next(n for n in ast.parse(source.read_text()).body if isinstance(n, ast.FunctionDef) and n.name == 'resolve_connection_display')
namespace = {}
exec(compile(ast.Module(body=[function], type_ignores=[]), str(source), 'exec'), namespace)
resolve = namespace['resolve_connection_display']


def test_per_item_modes_keep_destinations_and_editable_labels():
    original = {'custom_connections': [
        {'placeholder': 'Facebook', 'url': 'https://www.facebook.com/alex/', 'display': 'url'},
        {'placeholder': 'Instagram', 'url': 'https://instagram.com/alex', 'display': 'label'},
        {'placeholder': 'Portfolio', 'url': 'https://example.com/'},
        {'url': 'https://www.github.com/alex/'},
    ]}
    rendered = deepcopy(original)
    resolve(rendered)
    assert [c['placeholder'] for c in rendered['custom_connections']] == [
        'facebook.com/alex', 'Instagram', 'Portfolio', 'github.com/alex'
    ]
    assert [c['url'] for c in rendered['custom_connections']] == [c['url'] for c in original['custom_connections']]
    assert all('display' not in c for c in rendered['custom_connections'])
    assert original['custom_connections'][0]['placeholder'] == 'Facebook'
    assert original['custom_connections'][0]['display'] == 'url'
