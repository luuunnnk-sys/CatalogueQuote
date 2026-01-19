"""
Extraction des prix depuis le fichier CSV Chubb
Génère prices_data.json avec les vrais noms de produits (Libellé JDE)
"""
import json
import os
import re

base_path = os.path.dirname(os.path.abspath(__file__))
csv_file = os.path.join(base_path, "Classeur prix secur.csv")
output_file = os.path.join(base_path, "prices_data.json")

prices = {}

print(f"Lecture de: {csv_file}")

with open(csv_file, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

# Trouver la ligne d'en-tête
header_idx = None
for i, line in enumerate(lines):
    if 'CODE;LIBELLE' in line or 'Code;' in line:
        header_idx = i
        break

if header_idx is None:
    for i, line in enumerate(lines):
        if ';Article;' in line and 'Tarif' in line:
            header_idx = i
            break

print(f"En-tête trouvé à la ligne: {header_idx}")

def clean_price(raw_price):
    """Nettoie et formate le prix."""
    price = raw_price.strip()
    if not price:
        return None

    # Enlever les espaces internes
    price = re.sub(r'\s+', '', price)

    # Essayer d'extraire le nombre
    if price:
        match = re.search(r'[\d]+[,.]?\d*', price)
        if match:
            price = match.group().strip()
        else:
            return None

    # Formater avec virgule française
    if price:
        price = price.replace('.', ',')
        # S'assurer qu'il y a 2 décimales
        if ',' in price:
            parts_price = price.split(',')
            if len(parts_price) >= 2:
                if len(parts_price[1]) == 0:
                    price = parts_price[0] + ',00'
                elif len(parts_price[1]) == 1:
                    price = price + '0'
        else:
            price = price + ',00'

    return price if price and price != ',00' else None

def add_price_entry(code, price, name, description, famille, sous_famille):
    """Ajoute une entrée de prix avec toutes les variantes de code."""
    if not code or not price:
        return

    entry = {
        "price": price,
        "name": name,
        "description": description,
        "famille": famille,
        "sous_famille": sous_famille
    }

    # Stocker le code original
    prices[code] = entry

    # Si commence par 428, créer aussi la version sans 428
    if code.startswith('428'):
        code_without_428 = code[3:]
        prices[code_without_428] = entry

# Parser le CSV à partir de la ligne suivante
for line in lines[header_idx + 1:]:
    parts = line.strip().split(';')

    if len(parts) < 15:
        continue

    # Colonne 3 = Code article (index 3)
    raw_code = parts[3].strip()

    # Colonne 4 = Libellé court JDE = VRAI NOM DU PRODUIT
    libelle_jde = parts[4].strip() if len(parts) > 4 else ""

    # Colonne 5 = Libellé commercial = Description longue
    libelle_commercial = parts[5].strip() if len(parts) > 5 else ""

    # Colonne 14 = Prix (Tarif de référence)
    raw_price = parts[14].strip() if len(parts) > 14 else ""

    # Colonne 1 = Famille
    famille = parts[1].strip() if len(parts) > 1 else ""

    # Colonne 2 = Sous-famille
    sous_famille = parts[2].strip() if len(parts) > 2 else ""

    if not raw_code:
        continue

    # Nettoyer le prix
    price = clean_price(raw_price)

    if price:
        # Le nom principal est le Libellé JDE (court), sinon le commercial
        name = libelle_jde if libelle_jde else libelle_commercial
        description = libelle_commercial if libelle_jde else ""

        # Ne pas utiliser "Produit XXX" comme nom par défaut - garder vide si pas de nom
        if not name or name.startswith("TARIF") or name.startswith("CODE"):
            name = ""

        add_price_entry(raw_code, price, name, description, famille, sous_famille)

# Compter les codes uniques
unique_count = len(set(
    f"{p['price']}|{p['name']}" for p in prices.values() if p['name']
))
print(f"Prix extraits: {len(prices)} entrées ({unique_count} produits avec nom)")

# Stats sur les noms
with_name = sum(1 for p in prices.values() if p['name'])
without_name = sum(1 for p in prices.values() if not p['name'])
print(f"  - Avec nom: {with_name}")
print(f"  - Sans nom: {without_name}")

# Sauvegarder
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(prices, f, ensure_ascii=False, indent=2)

print(f"Sauvegardé dans: {output_file}")

# Afficher quelques exemples
print("\nExemples de produits:")
seen = set()
for code, data in list(prices.items()):
    if data['name'] and code not in seen and not code.startswith('428'):
        seen.add(code)
        print(f"  {code}: {data['name'][:40]} - {data['price']} EUR")
        if len(seen) >= 15:
            break
