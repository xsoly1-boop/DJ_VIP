#!/usr/bin/env python3
import sys
import os
import re

def configure_signing(team_id):
    project_path = "ios/App/App.xcodeproj/project.pbxproj"
    if not os.path.exists(project_path):
        print(f"Error: No se encontró el archivo del proyecto en {project_path}")
        return False
        
    with open(project_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Modificar TargetAttributes del Target principal (App)
    # Target ID principal es 504EC3031FED79650016851F
    target_attrs_pattern = r"(504EC3031FED79650016851F\s*=\s*\{[^{}]*)"
    def repl_target_attrs(match):
        block = match.group(1)
        if "DevelopmentTeam" in block:
            block = re.sub(r"DevelopmentTeam\s*=\s*\w+;", f"DevelopmentTeam = {team_id};", block)
        else:
            block += f"\n\t\t\t\t\t\tDevelopmentTeam = {team_id};"
        return block

    new_content = re.sub(target_attrs_pattern, repl_target_attrs, content)

    # 2. Modificar buildSettings de Debug y Release
    # 504EC3171FED79650016851F (App Target Debug)
    # 504EC3181FED79650016851F (App Target Release)
    # 504EC3141FED79650016851F (Project Debug)
    # 504EC3151FED79650016851F (Project Release)
    config_ids = [
        "504EC3171FED79650016851F",
        "504EC3181FED79650016851F",
        "504EC3141FED79650016851F",
        "504EC3151FED79650016851F"
    ]
    
    for config_id in config_ids:
        pattern = rf"({config_id}\s*/\*.*?\*/\s*=\s*\{{.*?buildSettings\s*=\s*\{{)(.*?)(\}};\s*name\s*=\s*\w+;\s*\}})"
        
        def repl_build_settings(match):
            prefix = match.group(1)
            settings = match.group(2)
            suffix = match.group(3)
            
            # Quitar DEVELOPMENT_TEAM antiguo si existe y agregar el nuevo
            if "DEVELOPMENT_TEAM" in settings:
                settings = re.sub(r"\bDEVELOPMENT_TEAM\s*=\s*[^;]+;", f"DEVELOPMENT_TEAM = {team_id};", settings)
            else:
                settings = f"\n\t\t\t\tDEVELOPMENT_TEAM = {team_id};" + settings
            
            # Asegurar que CODE_SIGN_STYLE es Automatic
            if "CODE_SIGN_STYLE" in settings:
                settings = re.sub(r"\bCODE_SIGN_STYLE\s*=\s*[^;]+;", "CODE_SIGN_STYLE = Automatic;", settings)
            else:
                settings = f"\n\t\t\t\tCODE_SIGN_STYLE = Automatic;" + settings
                
            return prefix + settings + suffix
            
        new_content = re.sub(pattern, repl_build_settings, new_content, flags=re.DOTALL)

    with open(project_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
    print(f"✅ Archivo Xcode (.xcodeproj) configurado exitosamente con Team ID: {team_id} y Firma Automática.")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 configure_signing.py <TEAM_ID>")
        print("Ejemplo: python3 configure_signing.py A1B2C3D4E5")
        sys.exit(1)
        
    team_id = sys.argv[1].strip().upper()
    if not re.match(r"^[A-Z0-9]{10}$", team_id):
        print("❌ Error: El Team ID de Apple debe ser un código alfanumérico de 10 caracteres (ej. A1B2C3D4E5).")
        sys.exit(1)
        
    if configure_signing(team_id):
        sys.exit(0)
    else:
        sys.exit(1)
