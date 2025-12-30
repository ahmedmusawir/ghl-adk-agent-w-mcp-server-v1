# /utils/focus_group_utils.py

import json
from pathlib import Path

def write_json_data(data: str, filename: str = "focus_group_results.json"):
    """
    Writes a given string of data to a JSON file.
    Assumes the input data is a string that can be loaded as JSON.
    """
    output_dir = Path("output/focus_group")
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / filename
    
    try:
        data_to_write = json.loads(data)
    except json.JSONDecodeError:
        data_to_write = {"raw_output": data}
        
    with open(file_path, "w") as f:
        json.dump(data_to_write, f, indent=4)

    return f"Successfully wrote data to {file_path}"