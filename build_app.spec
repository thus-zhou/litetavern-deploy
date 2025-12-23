# PyInstaller Spec File for AI_RPG
# This file is used to build the standalone executable.

import sys
import os
from PyInstaller.utils.hooks import collect_data_files

block_cipher = None

# Include assets and web files
# Format: (source_path, destination_folder)
# '.' as destination means root of the bundle
datas = [
    ('index.html', '.'),
    ('script.js', '.'),
    ('style.css', '.'),
    ('themes.css', '.'),
    ('manifest.json', '.'),
    ('service-worker.js', '.'),
    ('assets', 'assets')
]

a = Analysis(
    ['server.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='AI_RPG',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True, # Set to False to hide console window (but keep True for debugging now)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/paper.png'
)
