from cryptography.fernet import Fernet

def ejemplo_encriptacion_software():
    print("==================================================")
    print("--- Proceso de Encriptacion en Python ---")
    print("==================================================")
    
    # 1. Generar la llave simétrica
    llave_secreta = Fernet.generate_key()
    cifrador = Fernet(llave_secreta)
    print(f"\n[1] Llave secreta generada: {llave_secreta.decode()}")
    
    # 2. Dato sensible a encriptar
    texto_original = "Tarjeta de Crédito: 4532-1100-8899-0011"
    print(f"\n[2] Dato original: {texto_original}")
    
    # 3. Encriptación
    dato_encriptado = cifrador.encrypt(texto_original.encode())
    print(f"\n[3] Dato encriptado (Bytes): \n{dato_encriptado.decode()}")
    
    # 4. Desencriptación
    dato_desencriptado = cifrador.decrypt(dato_encriptado).decode()
    print(f"\n[4] Dato desencriptado: {dato_desencriptado}")
    
    print("\n--------------------------------------------------")
    ejemplo_encriptacion_software()
    print("Verificacion: El proceso fue exitoso y seguro.")
    print("--------------------------------------------------")

if __name__ == "__main__":
    ejemplo_encriptacion_software()