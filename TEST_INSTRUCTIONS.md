# Instructions de Test - LST Application

## ✅ Serveur démarré
Le serveur Flask tourne sur **http://127.0.0.1:5000**

## ✅ Tests Backend Réussis
- ✅ "bonjour" → bonjour.mp4
- ✅ "aller dentiste" → aller.mp4 + dentiste.mp4  
- ✅ "vais dentiste" → aller.mp4 + dentiste.mp4 (lemmatization)

## 🎯 Comment Utiliser

### 1. Ouvrir le navigateur
Allez à : **http://127.0.0.1:5000**

### 2. Vérifications visuelles
- ✅ Vidéo de repos (nomove.mp4) devrait se charger automatiquement
- ✅ Les boutons personnalisés devraient être visibles : 🐌 🔄 ⏹ ▶️
- ✅ En haut : 4 boutons de langue (دارجة, FR, عربي, EN)
- ✅ Bouton Mode Daltonien (👁️)
- ✅ Deux boutons d'aide flottants en bas à droite : ℹ️ et ⌨️

### 3. Test de traduction simple

**Interface de saisie :**
1. Tapez "bonjour" dans la zone de texte
2. Cliquez sur le bouton **"Traduire"** (ou **Ctrl+Enter**)
3. ➡️ La vidéo **bonjour.mp4** devrait s'afficher et se lire

**Résultats attendus :**
- ✅ Vidéo bonjour.mp4 se lit (muette, sans son)
- ✅ Queue affiche : **"bonjour"**
- ✅ Message : "1 signe(s) trouvé(s)"
- ✅ Contrôles de lecture apparaissent (⏮ ⏸ ⏭ ⏹)
- ✅ Boutons personnalisés : 🐌 🔄 ⏹ ▶️

### 4. Test multilingue + conjugaison

**Français :**
- Tapez "je vais dentiste" 
- ➡️ Devrait jouer : **aller.mp4** puis **dentiste.mp4**
- Queue affiche : **"vais"** **"dentiste"** (mots originaux !)

**Anglais :**
1. Changez de langue en cliquant sur bouton **EN**
2. Tapez "I went to the dentist"
3. ➡️ Devrait jouer : **aller.mp4** puis **dentiste.mp4**
4. Queue affiche : **"went"** **"dentist"** (mots originaux, PAS "go" !)

**Tunisien :**
1. Bouton **دارجة**
2. Tapez "مرحبا" (marhaba = bonjour)
3. ➡️ Devrait jouer : **bonjour.mp4**

### 5. Fonctionnalités avancées

**Contrôles vidéo :**
- 🐌 = Ralenti (0.5x)
- 🔄 = Replay dernière séquence
- ⏹ = Stop (retour à nomove.mp4)
- ▶️ = Vitesse normale (1x)

**Raccourcis clavier :**
- **Space** = Play/Pause
- **S** = Slow (ralenti)
- **R** = Replay
- **T** = Stop
- **N** = Normal speed
- **C** = Mode daltonien
- **Ctrl+M** = Microphone
- **Esc** = Clear

**Queue interactive :**
- Cliquez sur un mot dans la queue **→** Saute directement à ce mot

**Modes d'entrée :**
- ✏️ **Écrire** = Tapez du texte
- 🎤 **Parler** = Reconnaissance vocale (4 langues)

### 6. Test reconnaissance vocale

1. Cliquez sur l'onglet **🎤 احكي** (Parler)
2. Cliquez sur **🎤 ابدأ التسجيل**
3. Dites "bonjour"
4. ➡️ La vidéo bonjour.mp4 devrait se lire automatiquement

**Langues reconnues :**
- Tunisien (ar-TN)
- Français (fr-FR)  
- Arabe standard (ar-SA)
- English (en-US)

### 7. Si rien ne s'affiche

**Vérifier la console navigateur (F12) :**
- Cherchez des erreurs JavaScript (rouge)
- Vérifiez que les requêtes `/videos/nomove.mp4` réussissent (statut 200)

**Rafraîchir :**
- **Ctrl+Shift+R** (rafraîchissement dur, vide le cache)

**Vidéos disponibles dans vidss :**
- nomove.mp4 (défaut)
- bonjour.mp4
- aller.mp4
- allergie.mp4
- carte d'identité.mp4
- dentiste.mp4
- faire.mp4
- fièvre.mp4
- laboratoire.mp4
- salle de radiologie.mp4
- visage.mp4
- vouloir.mp4
- ça va.mp4

## 🐛 Dépannage

**Problème : Vidéo ne se charge pas**
- Vérifiez que le serveur tourne (terminal devrait afficher les requêtes)
- Vérifiez F12 Console pour erreurs
- Vérifiez que les vidéos existent dans `c:\Users\bouha\Downloads\vidss`

**Problème : Boutons non visibles**
- Rafraîchir avec Ctrl+Shift+R
- Vérifier que style.css se charge (F12 > Network)

**Problème : Traduction ne fonctionne pas**
- Vérifiez F12 > Network > requête POST `/translate`
- Devrait retourner `{"success": true, "videos": [...]}`

**Problème : Queue affiche traductions au lieu de mots originaux**
- C'est normal si vous changez de langue après avoir tapé
- Retapez le texte après avoir changé de langue

## ✨ Fonctionnalités Complètes Implémentées

✅ 4 langues (Tunisien, Français, Arabe, English)
✅ Reconnaissance vocale multilingue
✅ 60+ conjugaisons de verbes automatiques
✅ 20+ normalisations de pluriels
✅ Suppression accents et ponctuation
✅ 50+ stop words anglais filtrés
✅ 30+ synonymes de salutations
✅ **Affichage mots originaux dans queue** (pas traductions)
✅ Vidéos muettes (langue des signes sans son)
✅ Contrôles personnalisés (slow, replay, stop, normal)
✅ Transitions fluides avec préchargement
✅ Queue interactive clickable
✅ Replay intelligent de séquence
✅ Mode daltonien
✅ 20+ raccourcis clavier
✅ Modals d'aide (instructions + clavier)
✅ Vidéo de repos en boucle (nomove.mp4)

## 📞 Contact

Si vous rencontrez des problèmes, vérifiez :
1. Terminal serveur Flask (logs des requêtes)
2. Console navigateur F12 (erreurs JavaScript)
3. Network tab F12 (requêtes HTTP)
