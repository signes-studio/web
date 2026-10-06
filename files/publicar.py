import os
import subprocess
import sys

# Asegurar que el directorio de trabajo es la raíz del proyecto
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
os.chdir(project_root)

print("=" * 65)
print("   SIGNES.STUDIO — Publicador de Archivos y Transferencias")
print("=" * 65)
print("\n[1/3] Escaneando carpetas en /files y empaquetando descargas...")

try:
    # Ejecutar el constructor y publicador en Node.js
    result = subprocess.run(["node", "publish-files.js"], check=True)
    
    print("\n" + "=" * 65)
    print("   ¡TODO PUBLICADO CON ÉXITO!")
    print("   Los enlaces ya están disponibles en directo en:")
    print("   https://signes.studio/files/[nombre-carpeta]")
    print("=" * 65)
except subprocess.CalledProcessError as e:
    print(f"\n[!] Error durante la ejecución del script (código {e.returncode}).")
except Exception as e:
    print(f"\n[!] Error inesperado: {e}")

# Mantener la ventana abierta para que el usuario pueda ver el resultado
input("\nPulsa Enter para salir...")

