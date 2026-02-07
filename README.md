# Traducteur Langue des Signes Tunisienne (LST)

Application web de traduction texte/voix vers la Langue des Signes Tunisienne médicale.

> **🆕 Version 2.0** : Maintenant avec support pour avatar 3D animé ! Voir [ARCHITECTURE_3D_AVATAR.md](ARCHITECTURE_3D_AVATAR.md) pour les détails.

## 📋 Description

Cette application permet de traduire du texte saisi ou dicté en langue des signes tunisienne via :
- **Mode Vidéo** : Base de données de vidéos MP4 (version 1.0 - fonctionnelle)
- **Mode Avatar 3D** : Avatar virtuel avec animations FBX (version 2.0 - architecture complète)

Chaque signe représente un terme médical en LST.

## 🎯 Fonctionnalités

### Version 1.0 (Vidéos MP4) - ✅ Opérationnel
- ✍️ Saisie de texte manuel
- 🎤 Reconnaissance vocale (speech-to-text)
- 🎬 Lecture séquentielle automatique des signes
- ⏯️ Contrôles de navigation (lecture/pause, précédent/suivant)
- 📊 Affichage des mots traduits et non trouvés
- 📱 Interface responsive et moderne

### Version 2.0 (Avatar 3D) - 📐 Architecture Complète
- 🤖 Rendu 3D avec Three.js
- 🎭 Avatar humanoid avec skeleton Mixamo
- 🎬 Animations FBX pour chaque signe
- 🔄 Transitions fluides entre signes
- 📦 Système modulaire extensible pour la recherche

## 🛠️ Technologies Utilisées

### Backend
- **Python 3.x + Flask** : Serveur API
- **Sign Processor** : Normalisation et mapping NLP
- **Animation DB** : Gestion des assets FBX
- **Avatar Manager** : Configuration des modèles 3D

### Frontend
- **HTML5, CSS3, JavaScript** : Interface utilisateur
- **Web Speech API** : Reconnaissance vocale
- **Three.js** : Rendu 3D (avatar mode)

### Assets
- **Vidéos** : MP4 (dictionnaire médical LST)
- **Animations** : FBX/BVH (skeleton animations)
- **Modèles 3D** : GLTF (avatars humanoids)

## 📁 Structure du Projet

```
hackathon/
│
├── app.py                          # Serveur Flask (backend)
├── requirements.txt                # Dépendances Python
├── README.md                       # Ce fichier
│
├── 📚 Documentation/
│   ├── ARCHITECTURE_3D_AVATAR.md   # Architecture complète système 3D
│   ├── IMPLEMENTATION_GUIDE.md     # Guide d'implémentation étape par étape
│   └── AVATAR_SYSTEM_SUMMARY.md    # Résumé et démarrage rapide
│
├── backend/                        # 🆕 Modules backend
│   ├── __init__.py
│   ├── config.py                   # Configuration centralisée
│   ├── sign_processor.py           # Traitement NLP et mapping
│   ├── animation_db.py             # Gestion base de données animations
│   └── avatar_manager.py           # Configuration avatars
│
├── templates/
│   └── index.html                  # Interface utilisateur (mode vidéo)
│
├── static/
│   ├── style.css                   # Styles CSS
│   ├── script.js                   # Logique JavaScript (mode vidéo)
│   └── avatar-renderer.js          # 🆕 Rendu Three.js (mode avatar)
│
├── assets/                         # 🆕 Assets 3D
│   ├── avatars/
│   │   └── default_humanoid/       # Modèle avatar GLTF
│   ├── animations/
│   │   ├── medical/                # Animations FBX médicales
│   │   ├── anatomy/                # Animations FBX anatomie
│   │   ├── common/                 # Animations communes (idle, etc.)
│   │   └── animation_manifest.json # Métadonnées animations
│   └── config/
│       └── avatars.json            # Configuration avatars
│
└── DICTIONNAIRE MÉDICAL EN LANGUE DES SIGNES TUNISIENNE _AVST_/
    └── DICTIONNAIRE MÉDICAL EN LANGUE DES SIGNES TUNISIENNE _AVST_/
        ├── 1.L'anatomie du corps humain/
        ├── 2. Gynéco/
        ├── 3.Les differents types de malade et de maladie/
        ├── 4. Les professionels de la santé/
        ├── 5. les professions administratives/
        ├── 6. Les équipement médicals/
        ├── 7. l'hopital/
        └── 8. Les outils de communications/
```

## 🚀 Installation et Lancement

### Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)
- Navigateur moderne (Chrome, Firefox, Edge)

### Étapes d'installation

1. **Cloner ou télécharger le projet**
   ```bash
   cd hackathon
   ```

2. **Créer un environnement virtuel (recommandé)**
   ```bash
   python -m venv venv
   
   # Activer l'environnement (Windows)
   venv\Scripts\activate
   
   # Activer l'environnement (Linux/Mac)
   source venv/bin/activate
   ```

3. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

4. **Lancer l'application**
   ```bash
   python app.py
   ```

5. **Ouvrir dans le navigateur**
   ```
   http://127.0.0.1:5000
   ```

## 📖 Guide d'Utilisation

### Méthode 1 : Saisie de texte

1. Tapez votre phrase dans la zone de texte (ex: "médecin infirmier dentiste")
2. Cliquez sur le bouton "Traduire"
3. Les vidéos des signes correspondants s'affichent et se jouent automatiquement

### Méthode 2 : Reconnaissance vocale

1. Cliquez sur le bouton "🎤 Utiliser le microphone"
2. Autorisez l'accès au microphone si demandé
3. Parlez clairement votre phrase
4. Le texte reconnu apparaît automatiquement
5. Cliquez sur "Traduire"

### Contrôles de lecture

- **⏸️ Pause/▶️ Lecture** : Mettre en pause ou reprendre la vidéo
- **⏮️ Précédent** : Revenir au signe précédent
- **⏭️ Suivant** : Passer au signe suivant
- **⏹️ Arrêter** : Arrêter complètement la lecture

## 🔍 Fonctionnement Technique

### Backend (app.py)

1. **Indexation des vidéos** : Au démarrage, le serveur scanne tous les dossiers de vidéos et crée un dictionnaire de mots → fichiers MP4
2. **Normalisation du texte** : Le texte reçu est converti en minuscules, les accents sont supprimés, la ponctuation est retirée
3. **Correspondance** : Chaque mot est recherché dans le dictionnaire
4. **Réponse** : Liste des chemins vidéo correspondants (ordre préservé)

### Frontend (script.js)

1. **Envoi de la requête** : POST JSON vers `/translate`
2. **Réception des vidéos** : Liste des fichiers MP4 à charger
3. **Lecture séquentielle** : Utilise l'événement `ended` pour passer automatiquement à la vidéo suivante
4. **Gestion de la file** : Affiche la progression et permet la navigation

## 🤖 Système Avatar 3D (Version 2.0)

### Architecture Complète

Le système 3D avatar est **entièrement documenté et prêt à implémenter**. Voir :

📘 **[ARCHITECTURE_3D_AVATAR.md](ARCHITECTURE_3D_AVATAR.md)** - Architecture complète du système
- Diagrammes de flux de données
- Spécifications des composants backend/frontend
- Pipeline d'animation
- Points d'extensibilité pour la recherche

📗 **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Guide d'implémentation
- Instructions étape par étape
- Configuration Three.js
- Acquisition d'assets (Mixamo)
- Troubleshooting

📕 **[AVATAR_SYSTEM_SUMMARY.md](AVATAR_SYSTEM_SUMMARY.md)** - Résumé et démarrage rapide
- Vue d'ensemble du système
- Quick start en 3 étapes
- Checklist de test
- Prochaines étapes

### Modules Backend Créés

✅ **`backend/sign_processor.py`**
- Normalisation de texte (accents, ponctuation)
- Tokenisation et mapping mot → signe
- Future : règles de grammaire LST

✅ **`backend/animation_db.py`**
- Gestion de base de données d'animations FBX
- Génération de séquences d'animation
- Validation de compatibilité skeleton

✅ **`backend/avatar_manager.py`**
- Configuration d'avatars multiples
- Paramètres de rendu (qualité, LOD)
- Support skeleton Mixamo/Unreal

✅ **`backend/config.py`**
- Configuration centralisée
- Chemins d'assets
- Paramètres d'animation et rendu

### Frontend Three.js

✅ **`static/avatar-renderer.js`**
- Chargement de modèles GLTF
- Lecture d'animations FBX
- Transitions fluides entre signes
- Contrôles caméra orbit
- Gestion de pose idle

### Structure Assets

✅ Dossiers créés et documentés :
- `assets/avatars/` - Modèles 3D GLTF
- `assets/animations/` - Fichiers FBX par catégorie
- `assets/config/` - Configurations JSON
- READMEs avec instructions complètes

### Prochaines Étapes (3D Avatar)

1. **Acquérir Assets de Test** (voir Implementation Guide)
   - Télécharger avatar Mixamo → convertir en GLTF
   - Télécharger animations test → sauvegarder en FBX
   
2. **Tester le Système**
   - Ajouter les endpoints API à `app.py`
   - Créer page de test `templates/avatar_test.html`
   - Vérifier le rendu 3D

3. **Créer Vraies Animations LST**
   - Travailler avec signeurs LST
   - Motion capture ou animation manuelle
   - Remplacer animations placeholder

### API Endpoints (À Implémenter)

```python
/api/animations/sequence  # POST - Obtenir séquence d'animations
/api/avatars              # GET  - Lister avatars disponibles
/api/avatar/config        # GET  - Configuration avatar
/api/animations/manifest  # GET  - Catalogue animations
/assets/<path>            # GET  - Servir fichiers assets
```

Voir [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) pour le code complet.

## 🎨 Personnalisation

### Modifier les couleurs (static/style.css)

```css
:root {
    --primary-color: #2563eb;    /* Couleur principale */
    --secondary-color: #10b981;  /* Couleur secondaire */
    /* ... autres variables ... */
}
```

### Ajouter de nouvelles vidéos (Mode Vidéo)

1. Placez le fichier MP4 dans un dossier de catégorie approprié
2. Nommez le fichier exactement comme le mot qu'il représente (ex: `diabetes.mp4`)
3. Redémarrez le serveur pour réindexer

### Ajouter de nouvelles animations (Mode Avatar)

1. Créez animation FBX avec skeleton compatible
2. Placez dans `assets/animations/[category]/`
3. Mettez à jour `animation_manifest.json`
4. Redémarrez le serveur

## ⚠️ Remarques Importantes

### Mode Vidéo
- **Reconnaissance vocale** : Fonctionne uniquement sur les navigateurs supportant Web Speech API (Chrome, Edge)
- **Mots manquants** : Les mots non trouvés dans la base de données sont ignorés
- **Performance** : Pour de meilleures performances, utilisez des vidéos compressées
- **Langue** : La reconnaissance vocale est configurée en français (`fr-FR`)

### Mode Avatar 3D
- **Skeleton** : Animations et avatar doivent partager le même skeleton (Mixamo recommandé)
- **Formats** : GLTF pour avatars, FBX pour animations
- **Performance** : Three.js nécessite navigateur moderne avec WebGL
- **Assets** : Système prêt mais nécessite assets 3D réels (voir guides)

## 🐛 Résolution de Problèmes

### Mode Vidéo

**Le serveur ne démarre pas**
- Vérifiez que Flask est installé : `pip install flask`
- Vérifiez que le port 5000 n'est pas déjà utilisé

**Aucune vidéo ne s'affiche**
- Vérifiez que le dossier de vidéos existe et contient des fichiers MP4
- Consultez la console du serveur pour voir les vidéos chargées

**La reconnaissance vocale ne fonctionne pas**
- Utilisez Chrome ou Edge (pas Firefox)
- Acceptez les permissions microphone
- Vérifiez votre connexion internet (API nécessite une connexion)

**Les vidéos ne se chargent pas**
- Vérifiez la console du navigateur (F12) pour les erreurs
- Vérifiez que les chemins de fichiers sont corrects

### Mode Avatar 3D

**Voir le guide détaillé :** [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Section Troubleshooting
- Assurez-vous que les vidéos sont au format MP4 compatible

## 🔮 Évolutions Futures

- [ ] Support avatar 3D
- [ ] Traduction LST → Texte (inverse)
- [ ] Sauvegarde des traductions favorites
- [ ] Export vidéo de la traduction complète
- [ ] Mode hors-ligne (PWA)
- [ ] Dictionnaire étendu (non médical)
- [ ] Support multilingue

## 👥 Contribution

Projet développé pour le hackathon de traduction en langue des signes tunisienne.

## 📄 Licence

Ce projet est destiné à des fins éducatives et humanitaires.

---

**Note** : Cette application est un prototype de démonstration conçu pour être étendu avec des fonctionnalités d'avatar 3D dans les versions futures.
