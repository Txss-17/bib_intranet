# Intrabib — Portefeuille partenaires et sélection pilote par vague

**Décision du 7 novembre 2026.** La prospection, la qualification et les partenariats fournisseurs et logistiques ne sont **pas plafonnés**. La phase EI lance une première vague opérationnelle utilisant des produits provenant de **deux fournisseurs** et **un logisticien**, pour éprouver les flux avant une montée en charge progressive.

## Existant conservé
- Les candidatures fournisseurs continuent dans `supplier_applications` sans quota.
- Le réseau logistique continue dans `logistics_partners` sans quota.
- Les contrats, tarifs, audits, identités et éventuelles factures demeurent sous leur gouvernance propre. La sélection pilote ne leur donne pas un statut juridique, financier ou commercial nouveau.

## Nouvelle gouvernance
La migration `0089_pilot_partner_wave_selections.sql` crée `bib_pilot_partner_selections`, un registre indépendant du statut opérationnel des partenaires. Elle stocke les nominations, décisions de sélection, vagues, preuves, auteurs, et événements d'audit. Les limites de **sélections approuvées simultanément par vague** sont :
- vague 1 : 2 fournisseurs / 1 logisticien ;
- vague 2 : 4 fournisseurs / 2 logisticiens ;
- vague 3 : 8 fournisseurs / 3 logisticiens.

Le recrutement reste ouvert quel que soit le nombre de candidats, de partenaires qualifiés ou de contrats signés. Les plafonds ne s'appliquent qu'au registre des sélections approuvées, pas aux dossiers partenaires, ni au nombre de produits de chaque fournisseur. Les valeurs sont des plafonds de pilotage provisoires approuvés ici pour le code ; leur ajustement futur doit être versionné.

## Conditions techniques
- Une candidature fournisseur doit être `approved` pour être proposée à une vague.
- Un logisticien suspendu ou inactif ne peut pas être proposé.
- Une personne habilitée propose, une **autre personne** habilitée approuve avec référence probante (8 à 500 caractères).
- Des verrous transactionnels évitent le dépassement concurrent des plafonds ; l'historique des décisions est conservé.
- Les politiques RLS s'appuient sur les permissions natives `supplier.applications` ou `ops.partners`, et séparent les comptes d'essai des dossiers réels.
- Le registre ne change pas les statuts des tables opérationnelles, n'active pas les API, n'envoie aucune commande, ne déplace aucun stock et ne déclenche aucun paiement. Une sélection approuvée est une **autorisation de périmètre de recette**, pas un Go live.
- Les opérations réelles du pilote exigent leurs autorisations juridiques, Finance, contrats, Stripe/PSP, assurance et contrôles de rapprochement indépendants.

## Mise en service conditionnelle
1. Revue de la migration et des permissions et test sur base de recette connectée.
2. Contrôle de RLS avec rôles fournisseur, logistique, lecture seule et comptes d'essai.
3. Deux nominations + une troisième approbation refusée pour fournisseur, et une deuxième approbation refusée en logistique (vague 1).
4. Revue distincte des preuves, incidents, stock, commandes, factures et rollback.
5. Go/No-Go de Direction enregistré avant expansion de la capacité.

**État de cette livraison :** code en PR uniquement. Aucune migration distante exécutée, aucun recrutement fermé et aucun partenaire activé automatiquement.

## Audit du circuit après candidature (7 novembre 2026)
- **Identité fournisseur** : Platform exporte la candidature dans le registre opérationnel `suppliers(platform_id)` via le bridge ; `supplier_applications.id` est un identifiant distinct et ne doit pas être utilisé pour autoriser un fournisseur. La sélection pilote #56 utilise donc exclusivement le `suppliers.id` canonique, au statut `validated`. Une décision sur une candidature ne valide pas automatiquement un fournisseur ni chaque référence produit.
- **Identité logistique** : l'export Platform vers Intrabib ne transfère pas actuellement les dossiers `ops` comme un référentiel logistique consolidé. En attendant la synchronisation complète, un gestionnaire doit associer l'UUID exact `partner_onboarding_submissions.id` de Platform à `logistics_partners.id` après vérification des justificatifs ; le second valideur approuve cette association dans la sélection pilote. Ne pas se fier au nom ou à l'adresse e-mail seuls.
- **Affectation de commande** : `platform-bridge` refuse maintenant `assign_shipment` tant que `bib_pilot_logistics_assignment_allowed` ne retourne pas explicitement `true` pour l'UUID du dossier Platform. L'absence de migration, de sélection valide ou la suspension du logisticien déclenche un refus ; aucun fallback permissif.
- **Gouvernance** : ce blocage n'est pas une preuve de correspondance contractuelle ; l'examen juridique, l'assurance, les pièces KYC, la capacité de livraison et la preuve de contrôle humain restent nécessaires et doivent être consignés dans la référence de validation. Aucun paiement n'est activé par la sélection.
- **Déploiement coordonné** : cette modification doit être testée en préproduction avec une migration 0089 appliquée **avant** la fonction Edge modifiée, puis avec une liaison logistique autorisée ; tester aussi le refus d'un dossier non lié, suspendu ou hors vague. Ne pas déployer la fonction seule en production : les affectations seraient alors bloquées. Rollback documenté requis.
- **Limite ouverte** : les chemins de mutation opérationnelle autres que `assign_shipment` (par ex. traitement direct dans Platform, réapprovisionnement et actions portail) doivent être inventoriés et soumis à des protections adaptées. Le présent correctif ne constitue pas un verrou global sur tous les flux.
