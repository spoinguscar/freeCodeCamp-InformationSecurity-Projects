import hashlib

password_path = "./top-10000-passwords.txt"
salts_path = "./known-salts.txt"

with open(salts_path, "r", encoding="utf-8") as file:
    salts = file.readlines()
salts = [salt.strip() for salt in salts]

with open(password_path, "r", encoding="utf-8") as file:
    passwords = file.readlines()
passwords = [password.strip() for password in passwords]

hash_dict = {}

for password in passwords:
    result_hash = hashlib.sha1(password.encode()).hexdigest()
    hash_dict[result_hash] = password

def crack_sha1_hash(hash, use_salts = False):
    # If using salts, create list for every password 
    # that contains each salt appended and prepended
    result = "PASSWORD NOT IN DATABASE"

    if use_salts:
        for password in passwords:
            prepend_list = [salt + password for salt in salts]
            append_list = [password + salt for salt in salts]
            for item in [*prepend_list, *append_list]:
                if hashlib.sha1(item.encode()).hexdigest() == hash:
                    result = password
                    break
    elif hash in hash_dict:
        result = hash_dict[hash]
    
    return result