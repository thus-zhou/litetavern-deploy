import os
import sys
import shutil
import winshell
from win32com.client import Dispatch

# Target Installation Directory
# Use Local AppData to avoid Admin rights requirement
INSTALL_DIR = os.path.join(os.environ['LOCALAPPDATA'], 'AI_RPG')
EXE_NAME = 'AI_RPG.exe'
SOURCE_EXE = 'AI_RPG.exe' # Assumes this installer is in the same dir or bundled

def install():
    print(f"Installing to {INSTALL_DIR}...")
    
    if not os.path.exists(INSTALL_DIR):
        os.makedirs(INSTALL_DIR)
        
    # Copy Exe
    # If we are running as a bundled installer (PyInstaller onefile),
    # we might need to extract the payload. 
    # For this simple version, we assume the user has the 'AI_RPG.exe' and runs this script/exe to "Install" it.
    # OR better: We assume this script IS bundled WITH the AI_RPG.exe inside it.
    
    # Strategy: This script will be compiled to 'Setup.exe'.
    # It will look for 'AI_RPG.exe' in its own temporary directory (sys._MEIPASS)
    # So we must add 'dist/AI_RPG.exe' as data when building this installer.
    
    try:
        source_path = os.path.join(sys._MEIPASS, EXE_NAME)
    except:
        source_path = EXE_NAME # Dev mode
        
    dest_path = os.path.join(INSTALL_DIR, EXE_NAME)
    
    if os.path.exists(source_path):
        shutil.copy2(source_path, dest_path)
        print("Copied executable.")
    else:
        print(f"Error: Source file {source_path} not found.")
        input("Press Enter to exit...")
        return

    # Create Desktop Shortcut
    desktop = winshell.desktop()
    shortcut_path = os.path.join(desktop, "AI RPG.lnk")
    
    shell = Dispatch('WScript.Shell')
    shortcut = shell.CreateShortCut(shortcut_path)
    shortcut.Targetpath = dest_path
    shortcut.WorkingDirectory = INSTALL_DIR
    shortcut.IconLocation = dest_path
    shortcut.save()
    
    print("Shortcut created on Desktop.")
    print("Installation Complete!")
    print(f"You can uninstall by deleting {INSTALL_DIR}")
    
    # Launch app?
    # os.startfile(dest_path)
    input("Press Enter to finish...")

if __name__ == '__main__':
    install()
