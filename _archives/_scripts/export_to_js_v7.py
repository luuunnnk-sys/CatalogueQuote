"""
Export to JS - V7 (OPTIMIZED)
Corrections majeures:
1. Chemins relatifs (plus de chemins absolus)
2. Classification SSI améliorée avec plus de mots-clés
3. Détection type système améliorée
4. Association documents aux produits
5. Suppression des champs vides pour réduire la taille
6. Meilleur matching des fiches
"""
import json
import os
import csv
import re

# Base path - détection automatique du répertoire du script
base_path = os.path.dirname(os.path.abspath(__file__))

# Chemins absolus à remplacer (pour compatibilité multi-postes)
ABSOLUTE_PATHS_TO_REPLACE = [
    r"C:/Users/longueni/Desktop/Chubb produits code/",
    r"C:\Users\longueni\Desktop\Chubb produits code\\",
    r"C:\\Users\\longueni\\Desktop\\Chubb produits code\\",
    r"D:/Chubb produits code/",
    r"D:\Chubb produits code\\",
    r"d:/Chubb produits code/",
    r"d:\Chubb produits code\\",
]

def make_relative_path(path):
    """Convertit un chemin absolu en chemin relatif."""
    if not path:
        return ""

    path_normalized = path.replace("\\", "/")

    for abs_path in ABSOLUTE_PATHS_TO_REPLACE:
        abs_normalized = abs_path.replace("\\", "/")
        if path_normalized.startswith(abs_normalized):
            return path_normalized[len(abs_normalized):]

    # Si c'est déjà un chemin relatif ou autre format
    if path_normalized.startswith("Fiche catalogue") or path_normalized.startswith("Technique"):
        return path_normalized

    # Essayer d'extraire la partie relative
    markers = ["Fiche catalogue/", "Technique/", "Certificat/", "Flash Info/", "Flash info technique/"]
    for marker in markers:
        if marker in path_normalized:
            idx = path_normalized.find(marker)
            return path_normalized[idx:]

    return path_normalized

# ============================================
# CLASSIFICATION SSI AMÉLIORÉE
# ============================================
SSI_CATEGORIES = {
    "detection": {
        "name": "Détection",
        "keywords": [
            # Détecteurs principaux
            "détecteur", "detecteur", "detector",
            "i.scan", "iscan", "i scan", "c.scan", "cscan", "c scan",
            "vesda", "vea", "veu", "ves", "vep", "vlc", "vlf", "vli", "vls", "vft",
            "osid", "osi-", "laser.scan", "laserscan",
            "stratos", "modulaser", "icam", "ils-",
            "optique", "thermique", "thermostatique",
            "fumée", "fumee", "smoke", "fumées",
            "flamme", "flame", "ir2", "irx", "uv/ir",
            "linéaire", "lineaire", "linéaires",
            "aspiration", "multiponctuel", "multi-ponctuel",
            "dts", "câble détecteur", "cable detecteur",
            "faast", "flx-", "firecatcher", "araani",
            "daaf", "daaco", "daa-", "10y29", "10llco", "10lldco",
            "trco5", "oc05", "s05ex", "trc05fex", "oc05fex",
            # Socles
            "socle s0", "socle iscan", "socle i.scan",
            "sqg3",
        ],
        "icon": "detection",
        "code_prefixes": ["440", "644", "640000", "6400001", "6400000"]  # Codes commençant par
    },
    "alarme": {
        "name": "Alarme & Signalisation",
        "keywords": [
            # Sirènes et diffuseurs
            "sirène", "sirene", "siren",
            "diffuseur", "flash",
            "sonore", "lumineux", "lumineuse",
            "son'ecla", "sonecla", "son ecla",
            "baes", "baeh", "baal", "baas", "baasl",
            "alarme", "alarm",
            "type 4", "type4", "t4", "type 4s",
            # Modèles spécifiques
            "sonos", "nexus", "hatari", "rolp",
            "sécurivoc", "securivoc", "sirroco",
            "solista", "pulse", "beacon",
            "évacuation", "evacuation",
            "signalisation", "signaling",
            # PPMS
            "ppms", "agylus",
            # Avertisseurs
            "avertisseur", "evacuateur",
            "ds dl", "ds rolp", "dsdl",
        ],
        "icon": "alarm",
        "code_prefixes": ["630", "6401"]
    },
    "centrale": {
        "name": "Centrales & ECS",
        "keywords": [
            # Centrales
            "centrale", "central", "ecs ",
            "cmsi", "ssi", "sdis",
            "uga", "uge", "uac ", "uai ", "ucr", "ues",
            "influence", "initium", "innova",
            # Tableaux
            "tableau", "panel", "coffret équipé",
            # Types spécifiques
            "uti.pack", "utipack", "uti.com", "uticom",
            "utc.pack", "utcpack", "utc.com", "utccom",
            "uth.pack", "uthpack", "uth.com", "uthcom",
            "utex.pack", "utexpack", "utex.com", "utexcom",
            # Cartes et modules centrales
            "carte sat", "carte uai", "carte ucr", "carte ues",
            "carte face avant", "carte déport", "carte deport",
            "carte 2f", "carte 4f", "carte 8f",
            "face avant 2za", "face avant 8f",
            # DAD
            "dad secouru", "dad ",
            # Bloc gestion
            "bloc gestion", "bloc alim",
        ],
        "icon": "central",
        "code_prefixes": ["52", "62", "670", "P75", "P77"]
    },
    "alimentation": {
        "name": "Alimentation",
        "keywords": [
            # Types d'alimentation
            "alimentation", "alim ", "alim.", "power supply",
            "batterie", "battery", "accu",
            "chargeur", "charger",
            # Modèles
            "variation", "resonance", "résonance",
            "dc/dc", "dcdc", "dc dc", "dc-dc",
            "aes ", "aes-", "slat",
            # Tensions
            "28v", "28,5v", "28.5v",
            "48v", "56v", "57v", "57,3v",
            "24v", "12v",
            # Caractéristiques
            "secourue", "secouru", "secours",
            "déportée", "deportee", "deport",
            "boostée", "boostee", "boost",
        ],
        "icon": "power",
        "code_prefixes": ["51", "76", "702"]
    },
    "declencheur": {
        "name": "Déclencheurs",
        "keywords": [
            # Types
            "déclencheur", "declencheur", "trigger",
            "manuel", "manual",
            "bris de glace", "bris glace", "break glass",
            "bouton", "button",
            # Modèles
            "dm ", "dm-", "mcp", "wcp",
            "mcp2", "mcp1", "mcp5", "wcp5",
            "sti-", "wst-",
            "call point", "callpoint",
        ],
        "icon": "trigger",
        "code_prefixes": ["627", "6270"]
    },
    "extinction": {
        "name": "Extinction",
        "keywords": [
            # Systèmes
            "extinction", "extinguish", "suppression",
            "sprinkler", "sprinkleur",
            # Agents
            "novec", "fm200", "fm-200", "fm 200",
            "co2", "gaz inerte", "gaz extincteur",
            "brouillard", "hi-fog", "hifog",
            # Équipements
            "firedetec", "daov", "déversoir",
            "diffuseur extinction", "buse",
            "électrovanne", "electrovanne",
            "pressostat", "manostat",
            "module puissance", "module extinction",
            # Argo
            "argo", "argonite",
        ],
        "icon": "extinguish",
        "code_prefixes": ["60"]
    },
    "desenfumage": {
        "name": "Désenfumage",
        "keywords": [
            # Systèmes
            "désenfumage", "desenfumage", "smoke extraction",
            # Équipements
            "exutoire", "skydome",
            "volet", "clapet", "damper",
            "ventilateur", "ventilation",
            # DCF/DAS
            "dcf", "dac ", "das ", "dac-", "das-",
            "commande désenfumage", "commande desenfumage",
            "coffret désenfumage", "coffret desenfumage",
        ],
        "icon": "smoke",
        "code_prefixes": []
    },
    "interface": {
        "name": "Interfaces & Reports",
        "keywords": [
            # Interfaces
            "interface", "passerelle", "gateway",
            "répétiteur", "repetiteur", "repeater",
            # TRE/Reports
            "tre ", "tre-", "trex", "innova-tre",
            "report", "déport", "deport",
            "lon.", "lon-", "lon ", "lonworks",
            ".rep", "-rep",
            # Communication
            "routeur", "router", "switch",
            "modem", "transmetteur", "transmission",
            "terminal", "télécommande", "telecommande",
            # Modules spécifiques
            "ucr ", "icf ", "icc ", "icf-", "icc-",
            "mono.rep", "rs.rep", "in.rep",
            # Réseaux
            "ethernet", "ip ", "tcp", "usb",
            "nic709", "lrw-",
            # DAGS
            "dags", "bz1l",
        ],
        "icon": "interface",
        "code_prefixes": ["66", "005"]
    },
    "accessoire": {
        "name": "Accessoires",
        "keywords": [
            # Supports et fixations
            "socle", "support", "embase",
            "fixation", "mounting", "bracket",
            # Câblage
            "câble", "cable", "fil ", "wire",
            "connecteur", "connector", "bornier",
            # Boîtiers
            "boîtier", "boitier", "coffret vide",
            "kit ", "kit-", "accessoire",
            # Détection spécifique
            "capillaire", "coude", "bouchon", "raccord",
            "te ", "té ", "tube ",
            # Maintenance
            "maintien", "magnétique", "magnetique",
            "testifire", "capsule", "testeur",
            "solo ", "aerosol",
            # Divers
            "étiquette", "etiquette", "plaque",
            "clé", "cle", "key",
            "parafoudre", "parasurtenseur",
            "isolon", "isolateur",
            "dysnar",
        ],
        "icon": "accessory",
        "code_prefixes": ["P0"]
    }
}


def detect_ssi_function(name, code, famille="", sous_famille=""):
    """Détecte la catégorie SSI avec algorithme amélioré."""

    # Mapping des familles CSV vers catégories SSI
    FAMILLE_TO_SSI = {
        # Détection
        "détection": "detection", "detection": "detection",
        "détecteur": "detection", "detecteur": "detection",
        "daaf": "detection", "vesda": "detection",
        # Alarme
        "alarme": "alarme", "baas": "alarme", "baal": "alarme",
        "sirène": "alarme", "sirene": "alarme",
        "diffuseur": "alarme", "signalisation": "alarme",
        "type 4": "alarme", "type4": "alarme",
        # Centrale
        "centrale": "centrale", "ecs": "centrale",
        "tableau": "centrale", "cmsi": "centrale",
        "uga": "centrale",
        # Alimentation
        "alimentation": "alimentation", "batterie": "alimentation",
        "alim": "alimentation", "power": "alimentation",
        # Déclencheur
        "déclencheur": "declencheur", "declencheur": "declencheur",
        "dm": "declencheur", "manuel": "declencheur",
        # Extinction
        "extinction": "extinction", "sprinkler": "extinction",
        "gaz": "extinction", "co2": "extinction",
        # Désenfumage
        "désenfumage": "desenfumage", "desenfumage": "desenfumage",
        "dcf": "desenfumage", "volet": "desenfumage",
        # Interface
        "interface": "interface", "report": "interface",
        "transmetteur": "interface", "réseau": "interface",
        "répétiteur": "interface", "repetiteur": "interface",
        # Accessoire
        "accessoire": "accessoire", "câble": "accessoire",
        "cable": "accessoire", "socle": "accessoire",
        "kit": "accessoire", "outillage": "accessoire",
        "consommable": "accessoire", "maintenance": "accessoire",
    }

    # D'abord essayer via la famille CSV (plus fiable)
    if famille:
        famille_lower = famille.lower()
        for key, ssi in FAMILLE_TO_SSI.items():
            if key in famille_lower:
                return ssi

    if sous_famille:
        sf_lower = sous_famille.lower()
        for key, ssi in FAMILLE_TO_SSI.items():
            if key in sf_lower:
                return ssi

    # Ensuite via le nom et le code
    if not name:
        return None

    name_lower = name.lower()
    code_str = str(code)

    # Score par catégorie
    scores = {cat: 0 for cat in SSI_CATEGORIES}

    for cat_id, cat_info in SSI_CATEGORIES.items():
        # Vérifier les mots-clés
        for keyword in cat_info["keywords"]:
            if keyword in name_lower:
                # Bonus pour les mots-clés longs (plus spécifiques)
                scores[cat_id] += len(keyword)

        # Vérifier les préfixes de code
        for prefix in cat_info.get("code_prefixes", []):
            if code_str.startswith(prefix):
                scores[cat_id] += 10

    # Retourner la catégorie avec le meilleur score
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] > 0:
        return best_cat

    return None


# ============================================
# DÉTECTION TYPE SYSTÈME AMÉLIORÉE
# ============================================
def detect_system_type(name, code):
    """Détecte si le produit est Adressable ou Conventionnel."""
    if not name:
        return None

    name_lower = name.lower()
    code_str = str(code)

    # Mots-clés Adressable (système bus, intelligent)
    adressable_keywords = [
        "i.scan", "iscan", "i scan", "i-scan",
        "influence", "initium", "innova",
        "lon ", "lon-", "lon.", "lonworks", "ftt", "lpt",
        "adressable", "addressable", "adress",
        "bus ", "bus-",
        "intelligent",
        "ad1000", "spectral",
        "vesda", "vea", "veu", "vep",
        "osid", "osi-re", "osi-rie",
        "laser.scan", "stratos", "icam",
        "faast", "flx-",
    ]

    # Mots-clés Conventionnel (collectif, 4 fils)
    conventionnel_keywords = [
        "c.scan", "cscan", "c scan", "c-scan",
        "conventionnel", "conventional", "conv.",
        "collectif", "collective",
        "4 fils", "4fils", "4-fils",
        "2 fils", "2fils",
        "zd ", "zone ", # Zones de détection conventionnelles
    ]

    # Vérifier Adressable
    for kw in adressable_keywords:
        if kw in name_lower:
            return "adressable"

    # Vérifier Conventionnel
    for kw in conventionnel_keywords:
        if kw in name_lower:
            return "conventionnel"

    # Heuristiques basées sur le code
    # Codes 640 généralement adressables (sauf C.Scan)
    if code_str.startswith("640") and "c.scan" not in name_lower and "cscan" not in name_lower:
        # Vérifier si ce n'est pas un DAAF/DAACO (autonome, ni l'un ni l'autre)
        if "daaf" not in name_lower and "daaco" not in name_lower:
            return "adressable"

    # Codes 66 (déports LON) = adressable
    if code_str.startswith("66"):
        return "adressable"

    return None


# ============================================
# GÉNÉRATION DE MOTS-CLÉS AUTOMATIQUE
# ============================================
def generate_keywords(name, code, ssi_function):
    """Génère des mots-clés de recherche pertinents."""
    if not name:
        return []

    keywords = set()
    name_lower = name.lower()

    # Extraire les mots significatifs du nom (>2 caractères)
    words = re.findall(r'[a-zàâäéèêëïîôùûü]+', name_lower)
    for word in words:
        if len(word) > 2 and word not in ['pour', 'avec', 'sans', 'sur', 'les', 'des', 'une', 'etc']:
            keywords.add(word)

    # Ajouter des synonymes et mots-clés métier
    keyword_mappings = {
        "detecteur": ["detection", "capteur", "sensor"],
        "detecteur": ["detection", "capteur", "sensor"],
        "sirene": ["alarme", "sonore", "evacuation"],
        "alarme": ["alerte", "signalisation"],
        "centrale": ["ecs", "ssi", "tableau"],
        "alimentation": ["alim", "power", "batterie"],
        "socle": ["support", "base", "embase"],
        "vesda": ["aspiration", "detection precoce"],
        "influence": ["centrale", "adressable", "lon"],
        "initium": ["centrale", "adressable"],
    }

    for trigger, synonyms in keyword_mappings.items():
        if trigger in name_lower:
            keywords.update(synonyms)

    # Ajouter la catégorie SSI comme mot-clé
    if ssi_function:
        keywords.add(ssi_function)

    return list(keywords)[:10]  # Limiter à 10 mots-clés


# ============================================
# CHARGEMENT DES DONNÉES
# ============================================
print("Chargement des données sources...")

# Load name fixes
name_fixes = {}
try:
    with open(os.path.join(base_path, "name_fixes.json"), "r", encoding="utf-8") as f:
        raw_fixes = json.load(f)
        for code, fix in raw_fixes.items():
            new = fix.get("new_name", "")
            if new and len(new) >= 3 and not new.startswith("norme") and not new.startswith("européen") and "Caractéristiques" not in new:
                name_fixes[code] = new
except Exception as e:
    print(f"Warning: Could not load name_fixes.json: {e}")

print(f"  - {len(name_fixes)} corrections de noms chargées")

# Load products from various sources
catalog_products = {}
try:
    with open(os.path.join(base_path, "extracted_products.csv"), "r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            catalog_products[row['code']] = row
except: pass
print(f"  - {len(catalog_products)} produits du catalogue")

fiche_products = {}
try:
    with open(os.path.join(base_path, "extracted_fiches.json"), "r", encoding="utf-8") as f:
        fiche_products = json.load(f)
except: pass
print(f"  - {len(fiche_products)} produits des fiches")

classified_products = {}
try:
    with open(os.path.join(base_path, "products_classified.json"), "r", encoding="utf-8") as f:
        classified_products = json.load(f)
except: pass
print(f"  - {len(classified_products)} produits classifiés")

documents_index = {}
try:
    with open(os.path.join(base_path, "documents_index.json"), "r", encoding="utf-8") as f:
        documents_index = json.load(f)
except: pass
print(f"  - {len(documents_index)} entrées dans l'index documents")

prices_data = {}
try:
    with open(os.path.join(base_path, "prices_data.json"), "r", encoding="utf-8") as f:
        prices_data = json.load(f)
except: pass
print(f"  - {len(prices_data)} prix chargés")

# Charger le matching intelligent des fiches PDF
fiche_matching = {}
try:
    with open(os.path.join(base_path, "fiche_matching.json"), "r", encoding="utf-8") as f:
        fiche_matching = json.load(f)
except: pass
print(f"  - {len(fiche_matching)} matchings de fiches PDF")

enhanced_data = {}
try:
    with open(os.path.join(base_path, "enhanced_data.json"), "r", encoding="utf-8") as f:
        enhanced_data = json.load(f)
except: pass

alerts_by_product = enhanced_data.get("alerts_by_product", {})
discontinued_products = set(enhanced_data.get("discontinued_products", []))
new_products = set(enhanced_data.get("new_products", []))
certified_products = set(enhanced_data.get("certified_products", []))
flash_info_list = enhanced_data.get("flash_info", [])

print(f"  - {len(alerts_by_product)} produits avec alertes")
print(f"  - {len(flash_info_list)} flash infos")

# Manual products additions
manual_products = {
    "640000062": {"name": "I.Scan+ O Blanc", "fiche": "Fiche catalogue/Détection incendie/Détecteur _ socle/I.Scan _ I.Scan+/CAT-CS_04_72-02_Fiche catalogue - I.Scan+ O.pdf"},
    "640000063": {"name": "I.Scan+ O Noir", "fiche": "Fiche catalogue/Détection incendie/Détecteur _ socle/I.Scan _ I.Scan+/CAT-CS_04_72-02_Fiche catalogue - I.Scan+ O.pdf"},
    "600200013": {"name": "DAOV Electrique V2/V3", "fiche": "Fiche catalogue/Extinction/Accessoires_outils/CAT-056_Fiche catalogue - DAOV électrique V3.pdf"},
}

# ============================================
# FUSION ET GÉNÉRATION DES PRODUITS
# ============================================
print("\nGénération des produits optimisés...")

all_codes_raw = set(catalog_products.keys()) | set(fiche_products.keys()) | set(classified_products.keys()) | set(manual_products.keys()) | set(prices_data.keys())

# FILTRER LES CODES 428 - On ne garde que les codes sans préfixe 428
# Les données du fichier prices_data.json contiennent les deux versions (avec et sans 428)
# mais on ne veut afficher que la version sans 428 pour éviter les doublons
all_codes = {code for code in all_codes_raw if not code.startswith('428')}
print(f"Total codes uniques (sans 428): {len(all_codes)}")

products_list = []
ssi_stats = {cat: 0 for cat in SSI_CATEGORIES}
type_stats = {"adressable": 0, "conventionnel": 0, "unknown": 0}
fiche_stats = {"with_fiche": 0, "without_fiche": 0}

for code in all_codes:
    cat = catalog_products.get(code)
    fic = fiche_products.get(code)
    classified = classified_products.get(code)
    manual = manual_products.get(code)
    price_entry = prices_data.get(code, {})
    docs = documents_index.get(code, [])
    alerts = alerts_by_product.get(code, [])

    final_name = ""
    final_source_path = ""

    # PRIORITÉ 1: Corrections manuelles de noms
    if code in name_fixes:
        final_name = name_fixes[code]

    # PRIORITÉ 2: Produits manuels (fiches définies à la main)
    if manual:
        if not final_name:
            final_name = manual.get("name", "")
        if manual.get("fiche"):
            final_source_path = manual["fiche"]

    # PRIORITÉ 3: Nom du CSV prix (Libellé JDE = vrai nom du produit)
    if not final_name and price_entry.get("name"):
        final_name = price_entry["name"]

    # PRIORITÉ 4: Matching intelligent des fiches PDF (basé sur le nom du produit)
    # C'est la source la plus fiable pour les fiches car elle matche nom produit -> nom fiche
    if not final_source_path and code in fiche_matching:
        matched = fiche_matching[code]
        if matched.get("score", 0) >= 0.5:  # Seulement si confiance suffisante
            final_source_path = matched.get("fiche", "")

    # PRIORITÉ 5: Fiches extraites (extraction automatique depuis les PDF)
    if not final_source_path and fic:
        final_source_path = fic.get("source", "")
        if not final_name:
            final_name = fic.get("name", "")

    # PRIORITÉ 6: Produits classifiés
    if not final_source_path and classified:
        final_source_path = classified.get("main_fiche", "")
        if not final_name:
            final_name = classified.get("name", "")

    # PRIORITÉ 7: Catalogue
    if cat:
        if not final_name:
            final_name = cat.get("name", "")
        if not final_source_path:
            final_source_path = cat.get("source", "")

    # Nom par défaut (seulement si vraiment aucun nom trouvé)
    if not final_name:
        final_name = f"Produit {code}"

    # CONVERTIR EN CHEMIN RELATIF
    file_url = make_relative_path(final_source_path)

    # Récupérer les infos de famille depuis le CSV prix
    famille = price_entry.get("famille", "")
    sous_famille = price_entry.get("sous_famille", "")

    # Détections
    has_dedicated_fiche = bool(fic) or bool(manual) or (classified and classified.get("is_main_product", False))
    system_type = detect_system_type(final_name, code)
    ssi_function = detect_ssi_function(final_name, code, famille, sous_famille)
    keywords = generate_keywords(final_name, code, ssi_function)

    # Stats
    if ssi_function:
        ssi_stats[ssi_function] += 1
    if system_type:
        type_stats[system_type] += 1
    else:
        type_stats["unknown"] += 1
    if file_url:
        fiche_stats["with_fiche"] += 1
    else:
        fiche_stats["without_fiche"] += 1

    # Formater documents (avec chemins relatifs)
    docs_formatted = []
    for d in docs[:5]:  # Limiter à 5 documents
        doc_path = make_relative_path(d.get("path", ""))
        if doc_path:
            docs_formatted.append({
                "type": d.get("type", "other"),
                "title": d.get("title", "Document"),
                "url": doc_path
            })

    # Formater alertes (avec chemins relatifs)
    alerts_formatted = []
    for a in alerts[:3]:  # Limiter à 3 alertes
        alert_path = make_relative_path(a.get("path", ""))
        if alert_path:
            alerts_formatted.append({
                "title": a.get("title", ""),
                "year": a.get("year"),
                "url": alert_path
            })

    # Construire l'objet produit (sans champs vides pour optimiser la taille)
    product = {
        "code": code,
        "name": final_name,
    }

    # Ajouter seulement les champs non-vides
    if file_url:
        product["url"] = file_url
    if price_entry.get("price"):
        product["price"] = price_entry["price"]
    # Description = Libellé commercial (description longue du produit)
    if price_entry.get("description"):
        product["desc"] = price_entry["description"]
    if keywords:
        product["keywords"] = keywords
    if has_dedicated_fiche:
        product["hasFiche"] = True
    if system_type:
        product["type"] = system_type
    if ssi_function:
        product["ssi"] = ssi_function
    if docs_formatted:
        product["docs"] = docs_formatted
    if alerts_formatted:
        product["alerts"] = alerts_formatted
    if code in discontinued_products:
        product["disc"] = True
    if code in new_products:
        product["new"] = True
    if code in certified_products:
        product["cert"] = True

    products_list.append(product)

# Flash info avec chemins relatifs
for fi in flash_info_list:
    fi["url"] = make_relative_path(fi.get("path", ""))

# SSI categories for frontend
ssi_categories_export = {
    k: {"name": v["name"], "icon": v["icon"], "count": ssi_stats[k]}
    for k, v in SSI_CATEGORIES.items()
}

# ============================================
# GÉNÉRATION DU FICHIER JS
# ============================================
output = {
    "products": products_list,
    "flashInfo": flash_info_list,
    "ssiCategories": ssi_categories_export,
    "stats": {
        "total": len(products_list),
        "adressable": type_stats["adressable"],
        "conventionnel": type_stats["conventionnel"],
        "withFiche": fiche_stats["with_fiche"],
        "withAlerts": sum(1 for p in products_list if p.get("alerts"))
    }
}

# Sauvegarder
output_file = os.path.join(base_path, "app_data.js")
with open(output_file, "w", encoding="utf-8") as f:
    # Version compacte (sans indentation excessive)
    f.write(f"const appData = {json.dumps(output, ensure_ascii=False, separators=(',', ':'))};")

# Calculer la taille
file_size = os.path.getsize(output_file)
print(f"\n{'='*60}")
print(f"EXPORT TERMINÉ")
print(f"{'='*60}")
print(f"Fichier généré: {output_file}")
print(f"Taille: {file_size / 1024 / 1024:.2f} MB")
print(f"\n--- STATISTIQUES ---")
print(f"Total produits: {len(products_list)}")
print(f"\nClassification SSI:")
for cat, count in sorted(ssi_stats.items(), key=lambda x: -x[1]):
    pct = count * 100 / len(products_list) if products_list else 0
    print(f"  {cat}: {count} ({pct:.1f}%)")
non_classified = len(products_list) - sum(ssi_stats.values())
print(f"  (non classifié): {non_classified} ({non_classified * 100 / len(products_list):.1f}%)")

print(f"\nType système:")
print(f"  Adressable: {type_stats['adressable']} ({type_stats['adressable'] * 100 / len(products_list):.1f}%)")
print(f"  Conventionnel: {type_stats['conventionnel']} ({type_stats['conventionnel'] * 100 / len(products_list):.1f}%)")
print(f"  Non déterminé: {type_stats['unknown']} ({type_stats['unknown'] * 100 / len(products_list):.1f}%)")

print(f"\nFiches catalogue:")
print(f"  Avec fiche: {fiche_stats['with_fiche']} ({fiche_stats['with_fiche'] * 100 / len(products_list):.1f}%)")
print(f"  Sans fiche: {fiche_stats['without_fiche']} ({fiche_stats['without_fiche'] * 100 / len(products_list):.1f}%)")
