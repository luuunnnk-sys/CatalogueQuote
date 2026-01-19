"""
Script de matching intelligent entre produits et fiches PDF
Analyse les noms des produits et les noms des fichiers PDF pour créer des associations
"""
import json
import os
import re
from difflib import SequenceMatcher

base_path = os.path.dirname(os.path.abspath(__file__))
fiche_dir = os.path.join(base_path, "Fiche catalogue")
output_file = os.path.join(base_path, "fiche_matching.json")
prices_file = os.path.join(base_path, "prices_data.json")

def normalize_name(name):
    """Normalise un nom pour la comparaison."""
    if not name:
        return ""
    # Mettre en minuscule
    n = name.lower()
    # Enlever les accents
    replacements = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'î': 'i', 'ï': 'i',
        'ô': 'o', 'ö': 'o',
        'ç': 'c'
    }
    for old, new in replacements.items():
        n = n.replace(old, new)
    # Enlever ponctuation et caractères spéciaux
    n = re.sub(r'[^a-z0-9]', ' ', n)
    # Normaliser les espaces
    n = ' '.join(n.split())
    return n

def extract_fiche_name(filepath):
    """Extrait le nom du produit depuis le chemin du fichier PDF."""
    filename = os.path.basename(filepath)
    # Enlever l'extension
    name = filename.replace('.pdf', '').replace('.PDF', '')
    # Enlever le préfixe CAT-XXX_
    name = re.sub(r'^CAT-[A-Z0-9_-]+_', '', name)
    # Enlever "Fiche catalogue - " ou similaire
    name = re.sub(r'^Fiche catalogue\s*[-–]\s*', '', name, flags=re.IGNORECASE)
    return name.strip()

def similarity(a, b):
    """Calcule la similarité entre deux chaînes."""
    return SequenceMatcher(None, a, b).ratio()

def word_match_score(product_name, fiche_name):
    """Calcule un score basé sur les mots en commun."""
    prod_words = set(normalize_name(product_name).split())
    fiche_words = set(normalize_name(fiche_name).split())

    if not prod_words or not fiche_words:
        return 0

    # Mots en commun
    common = prod_words & fiche_words

    # Ignorer les mots trop courts ou trop communs
    ignore_words = {'de', 'la', 'le', 'les', 'du', 'des', 'et', 'ou', 'en', 'a', 'pour', 'avec'}
    common = {w for w in common if len(w) > 2 and w not in ignore_words}

    if not common:
        return 0

    # Score = proportion de mots importants du produit trouvés dans la fiche
    important_prod_words = {w for w in prod_words if len(w) > 2 and w not in ignore_words}
    if not important_prod_words:
        return 0

    return len(common) / len(important_prod_words)

def find_best_fiche(product_name, product_code, fiches_list):
    """Trouve la meilleure fiche correspondant à un produit."""
    if not product_name:
        return None, 0

    prod_normalized = normalize_name(product_name)
    best_match = None
    best_score = 0

    for fiche_path, fiche_name in fiches_list:
        fiche_normalized = normalize_name(fiche_name)

        # Score de similarité de chaîne
        sim_score = similarity(prod_normalized, fiche_normalized)

        # Score de mots en commun
        word_score = word_match_score(product_name, fiche_name)

        # Bonus si le nom du produit est contenu dans le nom de la fiche
        contains_bonus = 0
        if prod_normalized in fiche_normalized or fiche_normalized in prod_normalized:
            contains_bonus = 0.3

        # Bonus pour correspondance exacte de mots clés importants
        key_bonus = 0
        key_words = ['iscan', 'scan', 'vesda', 'influence', 'initium', 'sirroco',
                     'solista', 'nexus', 'rolp', 'laser', 'osid', 'daaf', 'daaco',
                     'sonecla', 'baal', 'baas', 'icc', 'uai', 'uac', 'ucr', 'variation']
        for kw in key_words:
            if kw in prod_normalized and kw in fiche_normalized:
                key_bonus += 0.2

        # Score combiné
        total_score = (sim_score * 0.3) + (word_score * 0.4) + contains_bonus + min(key_bonus, 0.4)

        if total_score > best_score:
            best_score = total_score
            best_match = fiche_path

    # Seuil minimum pour considérer un match valide
    if best_score < 0.4:
        return None, 0

    return best_match, best_score

# Collecter toutes les fiches PDF
print("Scan des fiches PDF...")
fiches = []
for root, dirs, files in os.walk(fiche_dir):
    for f in files:
        if f.lower().endswith('.pdf'):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, base_path)
            fiche_name = extract_fiche_name(full_path)
            fiches.append((rel_path, fiche_name))

print(f"  {len(fiches)} fiches PDF trouvées")

# Charger les produits
print("\nChargement des produits...")
with open(prices_file, 'r', encoding='utf-8') as f:
    prices_data = json.load(f)

# Filtrer pour avoir des codes uniques (sans les doublons 428)
unique_products = {}
for code, data in prices_data.items():
    if code.startswith('428'):
        continue  # On garde seulement les versions sans 428
    if data.get('name'):
        unique_products[code] = data

print(f"  {len(unique_products)} produits avec nom")

# Matcher les produits aux fiches
print("\nMatching des produits aux fiches...")
matches = {}
matched_count = 0
high_confidence = 0

for code, data in unique_products.items():
    product_name = data.get('name', '')
    best_fiche, score = find_best_fiche(product_name, code, fiches)

    if best_fiche and score >= 0.4:
        matches[code] = {
            "fiche": best_fiche.replace("\\", "/"),
            "score": round(score, 3),
            "product_name": product_name
        }
        matched_count += 1
        if score >= 0.7:
            high_confidence += 1

print(f"\nRésultats:")
print(f"  - Produits matchés: {matched_count} ({matched_count*100/len(unique_products):.1f}%)")
print(f"  - Haute confiance (>0.7): {high_confidence}")
print(f"  - Sans match: {len(unique_products) - matched_count}")

# Sauvegarder
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(matches, f, ensure_ascii=False, indent=2)

print(f"\nSauvegardé dans: {output_file}")

# Afficher quelques exemples
print("\nExemples de matchs haute confiance:")
examples = [(code, m) for code, m in matches.items() if m['score'] >= 0.7][:15]
for code, m in examples:
    print(f"  {code}: {m['product_name'][:35]}")
    print(f"    -> {os.path.basename(m['fiche'])} (score: {m['score']})")
