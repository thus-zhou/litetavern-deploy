# PyInstaller Spec File for Installer (Setup.exe)

import sys
import os

block_cipher = None

# We need to verify if dist/AI_RPG.exe exists before building this
# So the build process should be: Build App -> Build Installer

# Include the main app executable as a resource
datas = [
    ('dist/AI_RPG.exe', '.') 
]

a = Analysis(
    ['install_script.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=['win32timezone'],
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
    name='AI_RPG_Setup',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='assets/paper.png'
)
