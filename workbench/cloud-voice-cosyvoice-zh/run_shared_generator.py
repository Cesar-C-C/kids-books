"""Run the project generator from the relocated shared runtime without editing it."""

import os
import runpy
import sys
from pathlib import Path


runtime = Path(r"C:\ProgramData\FunCosyVoice3")
site_packages = runtime / ".venv" / "Lib" / "site-packages"
sys.path[:0] = [
    str(site_packages),
    str(runtime / "CosyVoice"),
    str(runtime / "CosyVoice" / "third_party" / "Matcha-TTS"),
]

# Keep the handles alive for the whole process. Python removes a DLL search
# directory when its handle is garbage-collected.
dll_handles = []
if hasattr(os, "add_dll_directory"):
    for directory in [runtime / ".venv" / "Library" / "bin", site_packages / "torch" / "lib"]:
        if directory.is_dir():
            dll_handles.append(os.add_dll_directory(str(directory)))

generator = Path(__file__).resolve().parents[2] / "tools" / "generate_cloud_cosyvoice.py"
sys.path.insert(0, str(generator.parent))
sys.argv = [str(generator), *sys.argv[1:]]
runpy.run_path(str(generator), run_name="__main__")
