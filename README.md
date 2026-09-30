<div align="center">

# 🧠 Token Tycoon

**Dirigez un labo d'intelligence artificielle : construisez des data centers, vendez des tokens et entraînez des modèles toujours plus puissants.**

[![Jouer](https://img.shields.io/badge/▶_Jouer_en_ligne-c2603c?style=for-the-badge)](https://drastix235.github.io/token-tycoon/)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Sans dépendance](https://img.shields.io/badge/dépendances-0-2f8f5b?style=flat-square)
![Licence MIT](https://img.shields.io/badge/licence-MIT-blue?style=flat-square)

<img src="docs/screenshot.jpg" alt="Capture d'écran de Token Tycoon" width="800">

</div>

---

## 🎮 Le jeu

Vous démarrez avec un simple laptop et un développeur curieux. À vous de bâtir le plus grand labo d'IA de la galaxie, du 💻 laptop de dev jusqu'au 🛰️ data center orbital.

Tout repose sur **trois équilibres** :

| | Rôle |
|---|---|
| ⚡ **Production** | Vos machines produisent des tokens. |
| 🛒 **Demande** | Vos clients (développeurs, startups, banques, gouvernements… extraterrestres) achètent des tokens chaque seconde. |
| 🧠 **Entraînement** | Une part de votre compute entraîne le prochain modèle, qui **double le prix** de vos tokens. |

Produisez trop et votre stock déborde. Pas assez et vos clients attendent. Entraînez trop et vous ne vendez plus rien.

## ✨ Fonctionnalités

- 🏭 **10 machines** et **10 types de clients**, avec des paliers qui doublent vitesse et demande
- 🧠 **9 générations de modèles**, de *Nano* à *Superintelligence*
- 👷 **Ingénieurs SRE** qui automatisent la production, même jeu fermé (jusqu'à 8 h)
- 🔬 **68 recherches** : Flash Attention, Mixture of Experts, quantification…
- 💼 **Levée de fonds** (prestige) : recommencez avec des investisseurs qui boostent vos prix
- 💾 Sauvegarde automatique · 🌗 thème clair et sombre · 📱 compatible mobile

## 🚀 Lancer le jeu

- **En ligne** : [drastix235.github.io/token-tycoon](https://drastix235.github.io/token-tycoon/)
- **En local** : téléchargez le dépôt puis ouvrez `index.html` dans votre navigateur. Aucune installation n'est nécessaire.

## 📁 Structure

```
token-tycoon/
├── index.html        # Structure de la page
├── css/
│   └── style.css     # Apparence (thèmes, responsive)
├── js/
│   └── game.js       # Logique et équilibrage du jeu
└── docs/
    └── screenshot.jpg
```

## 🛠️ Personnaliser

Tout l'équilibrage se trouve en haut de [`js/game.js`](js/game.js) :

| Constante | Contenu |
|---|---|
| `INFRA` | Machines : prix, tokens produits, durée du cycle |
| `CLIENTS` | Types de clients et leur demande |
| `MODELS` | Modèles d'IA, coût d'entraînement et multiplicateur de prix |
| `UPGRADES` | Recherches |
| `BASE_PRICE`, `STOCK_SECONDS`, `INVESTOR_BONUS` | Réglages généraux |

## 📄 Licence

Distribué sous licence [MIT](LICENSE).
