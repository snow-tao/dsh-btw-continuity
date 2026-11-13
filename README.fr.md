# DSH BTW Continuity

Questions secondaires continues dans DeepSeek Harness : un panneau chronologique par session, des relances directes et aucune interruption de la tâche principale.

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · Français · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

> **BTW Continuity est une modification indépendante de [MichengAI DSH BTW 1.3.10](https://github.com/MichengAI/dsh-btw)**, sous licence Apache-2.0, sans approbation de DeepSeek AI ou MichengAI. Voir [NOTICE.md](NOTICE.md) pour l'attribution et les modifications.

## Fonctionnalités

- Tous les échanges BTW d'une session apparaissent dans un seul panneau chronologique.
- Le champ inférieur permet de relancer directement : Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne.
- Le champ commence sur une ligne, s'agrandit jusqu'à quatre, puis défile en interne et revient à une ligne après l'envoi.
- X masque uniquement le panneau ; la question suivante restaure l'historique visible.
- L'icône corbeille efface l'historique BTW de la session actuelle et recommence à zéro.
- Les réponses restent hors de la conversation principale, sauf demande explicite de retour via `send_message`.
- Réponses en lecture seule, questions sur une sélection, Markdown, formules, copie et huit langues.

## Interface actuelle

![Conversation BTW Continuity dans un panneau unique avec historique et champ de relance](assets/screenshots/btw-continuity-panel.webp)

## Prérequis

- DeepSeek Harness `>=0.2.0-rc.1 <0.3.0-0`
- Node.js 22+
- Un fournisseur de modèle configuré

**Ce paquet est une modification de `@michengai/dsh-btw`. Les deux enregistrent `/btw` et ne peuvent donc pas être activés ensemble.**

## Installation

Remplacez `desktop` par votre profil réel :

```bash
dsh plugin --profile desktop add dsh-btw-continuity@latest --registry=https://registry.npmjs.org/
```

Si l'activation n'est pas automatique, rechargez l'application de bureau ou redémarrez le service DSH correspondant.

## Utilisation

```text
/btw Résumez la proposition actuelle en une phrase
```

Vous pouvez aussi choisir `btw` dans le menu `/` ou utiliser **Demander à BTW** sur du texte sélectionné.

Développez le panneau et utilisez le champ inférieur. Les relances du panneau et `/btw` partagent le même historique.

| Action | Comportement |
| --- | --- |
| X | Masque le panneau sans effacer l'historique ; il est restauré à la question suivante. |
| Corbeille | Efface tout l'historique BTW de cette session et supprime le panneau. |
| Copier | Copie le Markdown original de la réponse correspondante. |

## Historique et confidentialité

- Les requêtes suivantes incluent les échanges BTW terminés et le contexte de la session principale, ce qui peut augmenter l'utilisation de tokens.
- Les requêtes sont envoyées uniquement au fournisseur configuré ; aucun destinataire tiers supplémentaire n'est ajouté.
- L'historique est conservé dans la mémoire du Host et perdu lors de son redémarrage. Copiez les réponses à conserver.

## Configuration

Dans **Plugins → BTW Continuity → Configurer**, vous pouvez autoriser des outils en plus de `send_message` (un par ligne) et remplacer le prompt intégré. Le mode par défaut est texte uniquement.

## Désinstallation

```bash
dsh plugin --profile desktop remove dsh-btw-continuity
```

## Développement

```bash
npm ci --ignore-scripts
npm run check
```

## Licence

[Apache-2.0](LICENSE) · [Attribution et modifications](NOTICE.md)
