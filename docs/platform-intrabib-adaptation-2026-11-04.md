# Adaptation de BIB Platform et Intrabib

## Cahier de mise en œuvre fonctionnel et technique

Version 1.0 · 4 novembre 2026 · Direction et responsables Fournisseurs, Audit, Finance, Opérations et Technique

Le chantier relie le référencement fournisseur aux ventes et à leur exécution. BIB Platform recueille les demandes et les événements commerciaux. Intrabib coordonne les contrôles, les décisions et les rapprochements. Les deux applications partagent les identifiants et l’historique nécessaires, avec des droits propres à chaque acteur.

Ce cahier définit les écrans, les données, les transitions autorisées et la recette à développer. Le premier lot porte sur les règles communes et les contrats d’échange. Les lots applicatifs suivent les dépendances décrites page par page et dans le backlog associé. Chaque lot reste ouvert jusqu’à preuve de recette.

### Décisions à conserver

| Sujet | Règle applicable | Référence |
| --- | --- | --- |
| Marchands tiers | Le marchand vend au client et achète au fournisseur dans le montage direct retenu. BIB orchestre dans les limites de son mandat. | DEC-001 et 010 |
| Boutiques propres | L’EI est acheteur et vendeur. Ventilation analytique par boutique, sans abonnement ni commission à soi-même. | DEC-002 et 003 |
| Stock | Sélectionner ou publier un produit ne transfère ni propriété ni stock. Le dépôt au 3PL ne constitue pas un achat par BIB. | DEC-011 |
| Personnalisation | Seules les quantités commandées et couvertes financièrement peuvent recevoir le feu vert de production. | DEC-012 et 017 |
| Échantillon | Contrôle physique et acceptation par le marchand avant publication de l’offre concernée. | DEC-013 |
| Audit | Le prix rémunère un contrôle défini. Le paiement ne garantit pas le référencement et BIB ne délivre pas de certification officielle. | DEC-008 et 009 |
| Conditions boutiques | Modèles communs contrôlés, identité réelle vérifiée et preuve de la version présentée à la commande. | DEC-015 et 020 à 022 |
| Paiements | Stripe est retenu, avec capacités et montage à valider. Les fonds disponibles et les autorisations de transfert doivent être contrôlés séparément. | DEC-016, 017 et 023 |

Les tarifs historiques des plans marchands et fournisseurs ne constituent pas les tarifs actifs de la phase EI. Les montants non finalisés restent des paramètres à valider dans BIB-00.

<!-- PAGE -->

## 1 État constaté dans les dépôts

La lecture porte sur les versions de code P et I indiquées dans les sources. Elle établit l’existence de composants et de règles dans GitHub. La recette en environnement connecté reste une étape distincte.

| Élément | Constat dans le code | Adaptation nécessaire |
| --- | --- | --- |
| Catalogue et ajout boutique | Le modèle sans préachat est déjà décrit. La documentation précise que la capacité fournisseur n’est pas encore une source de disponibilité dans Platform. P01 | Créer une disponibilité fournisseur vérifiée, distincte du stock physique et des réservations. |
| Échantillons | Des RPC dédiées encadrent réception et validation des échantillons payés. P02 | Rattacher la preuve à la configuration exacte et gérer la revalidation après modification substantielle. |
| Checkout | Le serveur contrôle des champs d’identité vendeur et réserve le stock local. P03 | Vérifier l’identité approuvée, le dossier légal et sa version. Concevoir séparément le futur parcours à la demande. |
| Textes boutiques | Les pages utilisent déjà des clauses communes au lieu des textes libres du thème. Leur version est encore indiquée dans le composant. P04 | Assemblage serveur, cycle d’approbation des modèles et conservation des textes réellement présentés. |
| Versions marchands | Les constantes JS et TS sont alignées entre elles. La migration initiale de consentement conserve une ancienne version de confidentialité. L’autoinscription marchande est fermée dans AuthContext. P05 | Unifier le registre lors du futur onboarding autorisé. Conserver la fermeture actuelle de l’autoinscription. |
| Audits fournisseurs | L’écran propose clôture au score. La liaison recherche un fournisseur par nom partiel et peut modifier son statut automatiquement. I01 | Identifier le fournisseur par ID exact et séparer rapport, revue autorisée et décision de référencement. |
| Factures internes | Un registre Finance existe. Son commentaire précise qu’il enregistre des pièces sans émettre juridiquement de facture ni exécuter un paiement. I02 | Relier devis, factures émises par le système habilité, avoirs, preuves et règlements. |
| Autorisations | Intrabib possède des contrôles serveur fondés sur les permissions enregistrées. I03 | Réutiliser ces contrôles dans les nouveaux parcours et tester chaque transition sensible. |
| Échanges entre applications | Un bridge existe pour produits, boutiques, réassorts, personnalisation, stocks et autres flux. P06 et I04 | Étendre les contrats aux audits, devis et versions légales avec reprise et dédoublonnage. |
| Préproduction | Les tâches I45 et I32 restent ouvertes et décrivent une recette isolée à effectuer. | Rapprocher les migrations et identifier les deux bases de staging avant exécution. |

Le backlog précise les compléments à apporter. Aucun module n’est classé terminé sur la seule présence d’un fichier ou d’un test qui recherche des mots dans le code.

<!-- PAGE -->

## 2 Répartition des responsabilités et des données

La recommandation technique conserve les deux applications et leurs mécanismes existants. Les services partagés sont introduits progressivement au travers des API et du bridge, sans créer deux dossiers indépendants pour la même opération. Les noms d’objets ci-dessous sont des propositions de conception à rapprocher du schéma réel.

| Objet | Autorité métier proposée | Présentation dans l’autre application |
| --- | --- | --- |
| Qualification fournisseur et dossier d’audit | Intrabib Fournisseurs et Audit | Statut et pièces externes autorisées dans l’espace partenaire Platform |
| Devis, facture de service BIB et rapprochement | Service Finance avec journal métier indépendant du PSP | Pièces et solde du partenaire concerné dans Platform |
| Produits, offres et commandes clients | BIB Platform | Projections et files de contrôle dans Intrabib |
| Inventaire et réceptions | Registre opérationnel alimenté par le fournisseur ou le 3PL autorisé | Disponibilité commerciale dans Platform et supervision dans Intrabib |
| Modèles juridiques et validations | Intrabib gouverne le registre des versions | Platform génère et présente les documents applicables |
| Preuves de présentation et acceptations | Enregistrées avec la transaction à la source | Consultation autorisée depuis Intrabib sans recréer la preuve |

### Règles communes aux événements

Un événement contient event_id, event_type, schema_version, source_app, environment, aggregate_id, aggregate_version, occurred_at, actor_id, correlation_id et causation_id. Son contenu ne comprend que les données nécessaires au destinataire. Les heures sont enregistrées en UTC et affichées dans le fuseau de l’utilisateur.

Le producteur conserve l’événement dans la même transaction que l’opération métier. Le consommateur accuse réception après persistance. La combinaison source_app et event_id est unique. Une nouvelle livraison du même événement restitue le même résultat et ne crée aucun doublon financier ou logistique.

### Historique et état de synchronisation

Chaque dossier montre son responsable, sa dernière révision, les pièces associées et les événements avant et après décision. Les projections affichent leur date de synchronisation. Un échec de liaison conserve le dossier source et ouvre une reprise supervisée. Une donnée périmée ne devient pas une disponibilité confirmée.

La qualification, le paiement, la conformité, le stock et la publication restent des états séparés. Une modification de l’un ne valide pas implicitement les autres.

<!-- PAGE -->

## 3 Référencement et audit documentaire initial

Le pôle Fournisseurs mène la présélection commerciale. Audit définit les références et justificatifs réellement à contrôler. Finance valide les conditions financières du devis avant sa communication au fournisseur. Le contrat et le devis doivent être applicables avant le démarrage de la prestation.

| Étape cible | Responsable et entrée requise | Sortie et blocage |
| --- | --- | --- |
| Candidature reçue | Fournisseurs attribue supplier_id et responsable. | Dossier unique et demande de pièces manquantes. |
| Présélection | Fournisseurs documente intérêt, capacité, prix et références retenues. | Refus motivé ou proposition. Aucune facturation automatique de candidature. |
| Périmètre défini | Audit regroupe les variantes couvertes par des preuves identiques et identifie les risques. | scope_version, références retenues, exclusions et livrables. |
| Contrat et devis proposés | Fournisseurs prépare la relation contractuelle. Finance contrôle identité, assiette, TVA et échéances. | Documents numérotés et versionnés. Aucune exécution payante sur devis brouillon. |
| Acceptation enregistrée | Le représentant habilité accepte la version précise du devis et les conditions applicables. | Identité, qualité du représentant, date, texte, empreinte et preuve de l’accord. |
| Démarrage autorisé | Contrat en vigueur, devis accepté, pièces suffisantes et condition financière du devis satisfaite. | Autorisation tracée. Paiement préalable seulement si prévu contractuellement. |
| Contrôle réalisé | Audit décrit les contrôles et rattache chaque constat aux références et preuves. | Rapport versionné, limites, anomalies et recommandations. |
| Décision de référencement | Relecteur autorisé contrôle le rapport et les pièces de conformité requises. | Références admises, à corriger, suspendues ou refusées avec motif. |

### Axes de statut à conserver

Qualification : reçue, en étude, présélectionnée, contractualisée, en contrôle, admise, à corriger ou refusée. Devis : brouillon, en validation Finance, envoyé, accepté, expiré, refusé ou remplacé. Prestation : non démarrée, autorisée, en cours, rapport soumis, rapport validé ou annulée. Facturation et paiement disposent de leurs propres états.

L’admission porte sur un périmètre identifié. Elle ne valide pas automatiquement tous les produits du fournisseur. Un rapport sans conclusions suffisantes ne permet pas la publication. Une évolution substantielle du périmètre après acceptation nécessite un complément accepté avant les travaux supplémentaires.

<!-- PAGE -->

## 4 Calcul du prix et traitement des contre audits

Le calcul repose sur une version de barème explicitement autorisée. Le devis conserve ses lignes, quantités, prix unitaires, remises, fiscalité et total. Le serveur recalcule les montants en unités monétaires entières ou en décimal exact, selon une règle d’arrondi documentée.

Prix net hors taxes = somme des lignes de prestation et frais acceptés moins remises. La TVA est calculée selon le régime et les opérations applicables. Le montant toutes taxes comprises est figé avec la version du devis. Un taux nul exige une justification fiscale plutôt qu’une valeur implicite.

| Exemple de calcul illustratif | Montant | Justification |
| --- | --- | --- |
| Contrôle documentaire de base | 150,00 € | Hypothèse d’exemple, pas un tarif universel |
| Complexité supplémentaire | 45,00 € | Périmètre décrit et accepté |
| Frais externes | 30,00 € | Coût annoncé et justificatif |
| Remise | moins 15,00 € | Accord commercial tracé |
| Total net | 210,00 € | 150 + 45 + 30 − 15 |
| TVA et total | 42,00 € et 252,00 € | Illustration à 20 % uniquement si ce régime est applicable |

Les paliers 150, 200 et 300 € figurant dans l’annexe C du contrat v5.4 sont indicatifs. Ils ne doivent pas être activés comme barème accepté par défaut. Le nombre d’unités en stock ne constitue pas le nombre de dossiers documentaires à facturer. Le tarif fournisseur de 19 € par mois et le prix d’audit sont suivis séparément.

### Circuit de contre audit

Une anomalie ouvre un dossier lié au lot, à la référence ou à l’unité concernée. Audit documente la nécessité d’un contrôle additionnel. Fournisseurs recueille les observations. Finance vérifie l’imputabilité, la base contractuelle et l’absence de prestation déjà payée au logisticien.

Le devis accepté précède les contrôles additionnels payants. La facturation du contre-audit intervient après réalisation et imputabilité établie conformément aux conditions contractuelles retenues. Une cause indéterminée ne crée pas automatiquement une dette fournisseur. Les contrôles ordinaires de réception restent dans le contrat logistique.

### Rapport et règlement

La clôture technique exige rapport final, auteur, relecteur autorisé, périmètre, preuves, conclusion et empreinte du document. Les corrections ultérieures créent une nouvelle version liée à la précédente. Le rapport externe est distinct des notes internes. Les informations urgentes de sécurité sont transmises indépendamment d’un litige sur le prix. La remise du rapport suit les conditions acceptées, sans blocage financier inventé.

<!-- PAGE -->

## 5 Écrans marchands et catalogue

Le tableau de bord utilise les mêmes objets que les parcours de commande et de contrôle. Les alertes ouvrent le dossier concerné. Les quantités, montants et états ne sont pas recalculés différemment dans chaque écran.

| Module Platform | Données et actions à intégrer | Critère fonctionnel |
| --- | --- | --- |
| Dashboard marchand | Offres sélectionnées, échantillons attendus, offres publiables, commandes, précommandes, quantités réservées, incidents et marge prévisionnelle. | Chaque chiffre a un périmètre, une date de référence et un lien vers les lignes sources. |
| Catalogue BIB | SKU, variantes, fournisseur exact, conformité, capacités, délai, configuration et prix fournisseur versionné. | Une référence non admise ne peut pas devenir une offre vendable. |
| Offre boutique | Liaison boutique, vendeur réel, référence, configuration, prix et validation d’échantillon. | La sélection crée une offre et ne crédite aucun stock. |
| Échantillon | Demande, devis éventuel, paiement, expédition, réception physique, revue, acceptation ou refus motivé. | L’acceptation concerne le marchand et la configuration contrôlée. |
| Modifications produit | Nature du changement, date d’effet, version et conséquences sur conformité, échantillon et prix. | Un changement substantiel suspend l’éligibilité concernée jusqu’à nouvelle validation. |
| Prix marchand | Coût fournisseur incluant la personnalisation convenue, frais ventilés, TVA et règle de marge explicite. | L’écran distingue marge sur coût et taux de marque sur vente. |

### Contrôle des prix

Pour un coût hors taxes de 12 €, une majoration de 50 % sur coût donne 18 € hors taxes. Un taux de marque de 50 % donne 24 € hors taxes. Le libellé et la formule doivent correspondre au choix enregistré. Les taxes et frais nécessaires à la rentabilité sont ensuite présentés séparément. La marge affichée ne constitue pas un bénéfice net.

Le prix fournisseur inclut la personnalisation prévue au contrat. Toute option supplémentaire est identifiée avant accord. Aucun minimum de marge historique n’est imposé sans base commerciale et juridique actuelle. Un changement de prix ne modifie pas une commande confirmée. Les commandes et factures conservent l’instantané de prix retenu.

### Publication d’une offre

Le serveur vérifie fournisseur et référence admis, conformité valide, échantillon accepté, configuration approuvée, prix complet, capacité fiable, délai annoncé et dossier légal de boutique applicable. Il réévalue ces conditions à la commande. Le contrôle du navigateur sert à informer le marchand et ne remplace pas ce contrôle serveur.

<!-- PAGE -->

## 6 Stocks précommandes et approvisionnement

Le système tient séparément propriété juridique, lieu de garde, état physique, allocation commerciale et réservation de commande. La quantité fournisseur disponible comporte une source, une heure de vérification et une expiration. Une capacité annoncée sans confirmation récente n’alimente pas librement le checkout.

| Objet | Règle de gestion | Contrôle attendu |
| --- | --- | --- |
| Stock fournisseur vierge | Propriété fournisseur tant que la cession contractuelle n’a pas eu lieu. | Pas d’achat ni de personnalisation déclenchés par l’ajout en boutique. |
| Dépôt au hub | Le 3PL garde les unités selon contrat. Le propriétaire reste explicitement enregistré. | Réception documentée, lot, quantité, état et coût de garde. |
| Allocation commerciale | Quota vendable distinct du stock physique et de la capacité de production. | Pas de double allocation entre boutiques et fenêtres. |
| Réservation | Opération atomique portant sur une quantité disponible ou une capacité confirmée. | Dernière unité attribuée à une seule commande. Libération contrôlée si échec. |
| Précommande | Fenêtre, quantité maximale, minimum éventuel, date de clôture et livraison annoncée. | Annulation et remboursement prévus si le seuil ou la capacité ne sont pas atteints. |
| Feu vert de production | Commandes fermes, prix acceptés, capacité confirmée et financement fournisseur réellement couvert. | Action serveur autorisée, horodatée et irréversible seulement dans le périmètre validé. |
| Retour et invendu | Retour lié au mouvement et à la boutique d’origine. | Contrôle avant réintégration, sans nouvelle acquisition fictive. |

Le repère de 20 % n’est pas un quota universel validé ni une quantité à fabriquer. Avec 200 unités vierges et un quota illustratif de 40 unités, cinq commandes autorisées produisent cinq unités personnalisées. Le reste demeure vierge.

### Ordre fournisseur et réception

Un ordre regroupe seulement des lignes compatibles par acheteur légal, fournisseur, SKU, configuration, version de prix, devise et fenêtre. Il indique quantités, destination 3PL, conditions de propriété et de risque, échéances et pièces attendues. Les factures restent individualisées par acheteur.

Les états fournisseur proposés suivent BIB-25 : brouillon, proposé, accepté, autorisé production, en production, prêt enlèvement, expédié 3PL, reçu 3PL et clos. Les refus, retards et annulations disposent d’événements motivés. Une réception 3PL créditée une fois ne peut pas être créditée à nouveau par un message dupliqué.

Les statuts de ventes privées et retours déjà définis dans BIB-00 restent conservés. Une table de correspondance relie les nouveaux états aux états existants avant migration.

<!-- PAGE -->

## 7 Suivi client et documents boutiques

Le client voit le nom commercial du produit, le vendeur réel, le prix total et la période de livraison annoncée. Le suivi expose des étapes compréhensibles : commande confirmée, préparation programmée, préparation en cours, contrôle, expédition et livraison. Les statuts internes fournisseur et les notes d’audit restent dans les espaces autorisés.

### Annulation et rétractation

L’annulation commerciale avant feu vert suit les conditions annoncées. Après ce jalon, le système conserve l’accès aux droits légaux applicables. Un logo marchand ne suffit pas à désactiver la rétractation. Les raisons de retour, la décision de remboursement et son exécution financière sont enregistrées séparément.

Une fonctionnalité de rétractation en ligne doit être prévue pour les contrats concernés, avec accès visible, identification de la commande, confirmation et accusé sur support durable indiquant la déclaration et sa date. Cette exigence découle des articles L221-21 et D221-5 applicables depuis le 19 juin 2026. Elle devient un critère de recette du parcours client. [S01] [S02]

### Modèles et champs autorisés

| Relation | Modèles de référence | Règle de présentation |
| --- | --- | --- |
| BIB vers marchand | JUR-M01 et JUR-M02 | CGU et CGS marchands, mandat lorsqu’il s’applique. |
| BIB vers acheteur | JUR-C01 et éventuellement JUR-C02 | Les CGS BIB couvrent une prestation propre de BIB, pas la vente du marchand. |
| Boutique vers acheteur | JUR-B01, JUR-B02 et JUR-B03 | CGV, CGU et mentions de la boutique enrichies de l’identité vérifiée du vendeur. |

Les clauses communes sont éditables uniquement par les rôles BIB habilités. Le marchand propose des corrections de données d’identité ou des demandes particulières. Une modification identitaire significative repasse en vérification. L’acceptation du modèle commun ne transfère pas à BIB la responsabilité légale du vendeur.

### Preuve à la transaction

Le serveur associe à chaque commande les model_id et versions, l’identité vendeur, le texte présenté, les paramètres applicables, l’empreinte, l’horodatage, le canal et la preuve d’acceptation requise. Une mise à jour future ne réécrit pas cet instantané. Les consentements marketing, choix cookies et informations de confidentialité sont des événements distincts.

Une identité complète mais non vérifiée, un modèle non approuvé ou une information obligatoire manquante empêchent la vente concernée. Les pages externes ne présentent aucune validation juridique ou certification non acquise.

<!-- PAGE -->

## 8 Files de travail dans Intrabib

Chaque dossier possède un responsable nommé, un pôle destinataire et une échéance contractuelle ou opérationnelle lorsqu’elle existe. La transition crée la tâche suivante et conserve son lien avec les preuves. Une notification ne vaut pas validation.

| Action | Pôle pilote | Validation et pièces |
| --- | --- | --- |
| Présélection et relation partenaire | Fournisseurs | Avis motivé, capacité, prix et références retenues. |
| Qualification technique et chiffrage | Audit | Périmètre, charge réelle, documents attendus et barème proposé. |
| Contrôle du devis | Finance | Identités, prix, TVA, échéances et conditions de paiement. |
| Communication et acceptation | Fournisseurs | Version transmise, représentant et preuve de l’accord externe. |
| Contrôle et rapport | Audit | Résultats et preuves, puis revue autorisée avant conclusion finale. |
| Admission et publication | Fournisseurs et contrôle habilité | Références admises, conformité et blocages levés explicitement. |
| Réception et incidents 3PL | Opérations et Logistique | Saisie unique Platform, lots, écarts, photos et quarantaine ciblée. |
| Facture et rapprochement | Finance | Devis ou ordre, prestation ou réception, facture, avoir éventuel et paiement. |
| Exception | Direction | Motif, durée, décision, responsable et mesure compensatoire. Une exception ne neutralise pas une obligation légale. |
| Modèle juridique | Gouvernance juridique désignée par la Direction | Rédaction, relecture compétente, approbation, date d’effet et publication. |

### Rapprochement financier

Le journal rapproche l’ordre ou le devis, les preuves d’exécution, la facture et les paiements. Il distingue enregistré, en contrôle, conforme, contesté, à régler, réglé, avoir requis et clos. Une facture n’est marquée payée qu’avec une preuve affectée au bon débiteur, à la bonne devise et au montant dû. Un simple bouton ne produit pas un virement.

Le paiement client confirmé, les fonds disponibles et le transfert autorisé sont trois informations distinctes. Stripe documente des soldes pending et available propres à chaque compte et des échecs de transfert à reprendre explicitement. Le montage et les responsabilités doivent être validés avant activation des flux tiers. [S03]

### Indicateurs Finance et Direction

Séparer GMV, ventes des marchands tiers, ventes réelles des boutiques de l’EI et revenus propres de services BIB. Exclure les factures à soi-même. Présenter chaque montant par devise, période, état et entité légale. Une vente EI de 100 € avec un achat de 60 € reste une vente de 100 € à traiter selon le régime applicable ; les 40 € d’écart ne deviennent pas le chiffre d’affaires.

<!-- PAGE -->

## 9 Modèle de données et contrats API

Les objets sont rapprochés des tables existantes avant création. Les identités et liens métier ne reposent jamais sur une recherche par nom. L’acheteur, le vendeur, le propriétaire du stock, le payeur et le dépositaire sont des rôles distincts, même lorsqu’ils désignent la même entité.

| Ensemble proposé | Champs ou liens indispensables |
| --- | --- |
| Dossier fournisseur | supplier_id, legal_entity_id, contrat applicable, responsable, statut, révision et environnement. |
| Audit et périmètre | audit_id, type initial ou contre-audit, scope_version, SKU ou familles, lots, pièces, imputabilité, auteur et relecteur. |
| Devis | quote_id, numéro, version, barème, lignes, HT, taxes, TTC, devise, validité, paiement et preuve d’acceptation. |
| Rapport | report_id, audit_id, version, auteur, validation, conclusion, pièces, empreinte et remise au partenaire. |
| Offre et capacité | store_id, seller_legal_entity_id, supplier_product_id, configuration, sample_validation_id, capacité, origine et expiration. |
| Approvisionnement | customer_order_id, procurement_order_id, buyer_legal_entity_id, fournisseur, prix figés, couverture financière, feu vert et lot. |
| Finance | invoice_id, émetteur, destinataire, devis ou ordre, avoirs, échéance, payment_events et preuves de règlement. |
| Gouvernance documentaire | model_id, version, statut, dates, champs autorisés, approbateurs et empreinte. |

### Commandes API à prévoir

Les commandes create_audit_case, submit_quote, approve_quote, accept_quote, authorize_audit, finalize_report et decide_reference sont des noms proposés. Chaque commande possède une liste fermée de champs, une autorisation serveur, un contrôle de révision et une clé d’idempotence. Le résultat contient l’objet mis à jour et son état de synchronisation.

Les commandes publish_store_document, reserve_supplier_capacity, release_capacity, authorize_production et reconcile_invoice suivent le même contrat. Les fonctions existantes de réservation et réception restent les points de contrôle tant que leur remplacement n’est pas validé.

Une requête portant une ancienne révision échoue avec conflit. Une commande identique rejouée avec la même clé restitue la réponse initiale. Réutiliser cette clé avec un contenu différent est refusé. L’acteur et ses droits sont résolus côté serveur ; les valeurs envoyées par le navigateur ne les remplacent pas.

### Documents externes

Les sorties partenaires emploient les termes commerciaux utiles : espace partenaire sécurisé, devis, contrôle et rapport. Les commentaires internes, coûts confidentiels, affectations de pôles et détails techniques d’Intrabib ou de BIB Audit ne sont pas ajoutés aux contrats ou rapports externes par défaut.

<!-- PAGE -->

## 10 Autorisations et migration

### Droits et séparation des contrôles

Intrabib réutilise can_intranet_action et les permissions enregistrées. Les rôles ne sont pas déduits du seul nom d’un pôle dans le navigateur. Le fournisseur consulte uniquement son dossier et les pièces qui lui sont destinées. Le marchand consulte ses boutiques et commandes. Le logisticien consulte les opérations attribuées nécessaires à l’exécution.

Les transitions financières relèvent des droits Finance. Les conclusions d’audit relèvent des droits Audit et de la revue requise. L’auteur ne valide pas seul un document sensible lorsque le workflow exige une validation distincte. Les urgences de sécurité peuvent déclencher un blocage ciblé, avec motif et revue, sans facture automatique.

### Publication et conservation

Un modèle passe par brouillon, relecture, approbation, publication puis remplacement ou retrait. La validation juridique et la validation Direction sont conservées comme étapes distinctes selon le document. Les pièces et journaux suivent une politique de conservation définie par catégorie, avec accès limité. La conservation des preuves n’autorise pas la rétention indéfinie de toutes les données techniques.

### Séquence de migration proposée

1. Identifier les bases de préproduction isolées et vérifier sauvegarde et restauration. Reprendre les contrôles de I32 sans déduire qu’une base accessible est un staging.
2. Inventorier schéma, migrations Drizzle et écarts des deux applications. Les fichiers SQL Supabase historiques ne sont pas rejoués en bloc.
3. Ajouter d’abord les structures et projections compatibles. Les nouveaux champs obligatoires ne sont rendus bloquants qu’après qualification des données existantes et plan de bascule.
4. Importer les anciennes pièces avec leur origine et leur statut historique. Ne pas inventer de validation, signature, date d’effet ou preuve d’acceptation manquante.
5. Exécuter la recette des refus et des parcours complets en environnement sandbox. Vérifier la séparation des comptes réels et de test.
6. Activer progressivement par fonctionnalité et population, avec procédure de retour technique préservant les écritures et preuves déjà créées.

### Reprise des échanges

Le bridge possède une file des événements non traités et une alerte sur les erreurs répétées. L’ordre des versions est contrôlé par dossier. Un ancien événement ne remplace pas une version plus récente. Les notifications passent elles aussi par un mécanisme de reprise après persistance de la transaction.

La mise en service exige les preuves de recette des deux applications, les contrats applicables et la validation des capacités financières réellement utilisées. L’existence d’une branche, d’une pull request ou d’un document ne vaut pas activation commerciale.

<!-- PAGE -->

## 11 Paramètres et arbitrages restants

Ces points ne créent aucune nouvelle décision adoptée. Le responsable indiqué doit produire une valeur ou une règle versionnée dans le référentiel compétent avant activation de la fonction concernée.

| Point à finaliser | Responsable proposé | Condition de déblocage |
| --- | --- | --- |
| Barème d’audit | Audit et Finance, validation Direction | Coûts, regroupement des variantes, suppléments, annulations, durée de validité et accord contractuel. |
| Paiement audit initial | Finance et Fournisseurs | Acompte ou paiement après prestation explicitement défini au devis et au contrat. |
| Début abonnement 19 € | Direction et Fournisseurs | Date ou événement retenu dans les conditions particulières signées, puis synchronisé au PSP. |
| TVA et facturation | Finance et conseil compétent | Régime effectif de l’émetteur et traitement de chaque prestation, sans présumer HT ou franchise. |
| Admission et contre audit | Audit et gouvernance juridique | Critères par catégorie, preuves, revue, imputabilité et procédure de contestation. |
| Capacité et quotas | Fournisseurs et Opérations | Source fiable, fraîcheur maximale, quotas par configuration, MOQ et expiration. Aucun 20 % universel par défaut. |
| Conditions fournisseur | Fournisseurs et Finance | Acheteur, jalon de facturation, échéance, acompte, couverture et propriété ou risque. Aucun délai de 15 jours imposé automatiquement. |
| Stripe et tiers | Finance et Technique | Montage autorisé, comptes éligibles, remboursement, litiges, frais, fonds disponibles et transfert testés. |
| Dossier légal boutique | Gouvernance juridique et Direction | Identité, informations obligatoires, médiation, version approuvée et date d’effet contrôlées. |
| Responsables et échéances | Direction | Personnes habilitées désignées et calendrier de réalisation arrêté après estimation. |

### Écarts documentaires à traiter

Le contrat fournisseur v5.4 consulté comporte encore une annexe D décrivant le workflow inter-pôles, alors que le suivi Git demande de séparer la procédure interne du contrat. La finalisation doit retirer ou réduire cette annexe à des engagements externes utiles et faire vivre la procédure détaillée dans Intrabib. Le présent cahier n’amende pas le contrat.

Les en-têtes du contrat consulté indiquent encore projet v5.0 malgré un historique v5.4. La version finale de signature doit présenter un identifiant homogène. Le registre des versions applicatives marchands doit également être rapproché du déclencheur historique avant toute nouvelle activation de l’onboarding.

### Jalons

L0 fixe règles et interfaces. L1 relie qualification, devis et audit. L2 couvre offre, échantillon, prix et gouvernance boutique. L3 couvre capacité, précommande, approvisionnement et réception. L4 assure rapprochement, suivi client et recette globale. Les dates de ces lots restent à définir ; aucune échéance technique nouvelle n’est réputée validée.

<!-- PAGE -->

## 12 Recette du référencement et des documents

Les scénarios sont à exécuter en préproduction. Pour chacun, conserver résultat attendu et obtenu, identifiant de dossier, révisions, rôle utilisé et preuves. Un scénario est réussi uniquement après observation des effets persistés et des refus attendus.

| Test | Situation à exercer | Résultat attendu |
| --- | --- | --- |
| T01 | Candidature sans présélection puis tentative de devis facturé automatiquement. | Aucun engagement ni facture créé sans base et autorisation. |
| T02 | Variantes partageant les mêmes justificatifs. | Le périmètre documente le regroupement ; pas de prix par unité de stock. |
| T03 | Devis avec lignes 150, 45, 30 et remise 15 ; TVA illustrative 20 %. | 210 HT, 42 de taxe, 252 TTC ; total identique serveur, PDF et espace partenaire. |
| T04 | TVA non renseignée ou devise contradictoire. | Validation financière bloquée jusqu’à résolution explicite. |
| T05 | Devis modifié après l’acceptation. | Version précédente conservée et nouvel accord demandé pour le supplément. |
| T06 | Facturation après prestation prévue au devis ; audit non prépayé. | Le démarrage respecte cette condition et ne force pas un prépaiement universel. |
| T07 | Audit payé avec résultat non conforme. | Paiement rapproché, référence refusée ou à corriger selon décision motivée. |
| T08 | Clôture sans rapport ou sans revue autorisée. | Refus serveur ; aucun statut final ni notification trompeuse. |
| T09 | Deux fournisseurs aux noms proches. | Toutes les écritures visent supplier_id exact ; aucun rapprochement par nom partiel. |
| T10 | Contre-audit portant sur un contrôle 3PL déjà payé. | Double facturation refusée ; prestation supplémentaire distincte à justifier. |
| T11 | Cause du défaut indéterminée, mais urgence de sécurité. | Blocage ciblé possible ; aucune dette fournisseur automatique. |
| T12 | Marchand modifiant les clauses standard par API ou thème. | Clauses communes protégées ; seuls les champs autorisés suivent la procédure prévue. |
| T13 | Identité remplie mais non vérifiée ou modèle non approuvé. | Publication et commande concernées bloquées côté serveur. |
| T14 | Nouvelle version CGV publiée après une commande. | Ancien texte, paramètres, vendeur, date et empreinte restent consultables pour cette commande. |
| T15 | Refus du marketing et des cookies facultatifs pendant l’achat. | Achat possible selon les conditions du service ; aucun consentement facultatif créé. |

Les tests T03 et T06 sont des scénarios de recette, pas l’adoption d’un tarif ni d’une modalité de paiement pour tous les partenaires.

<!-- PAGE -->

## 13 Recette des ventes des stocks et de la liaison

| Test | Situation à exercer | Résultat attendu |
| --- | --- | --- |
| T16 | Ajout d’une référence en boutique. | Offre créée, sans achat fournisseur ni augmentation du stock physique. |
| T17 | Échantillon accepté puis changement substantiel de configuration. | Nouvelle validation requise pour la nouvelle configuration. |
| T18 | Coût 12 et majoration 50 %, puis taux de marque 50 %. | Respectivement 18 HT et 24 HT, avec libellés et assiettes explicites. |
| T19 | Deux commandes simultanées pour la dernière unité ou capacité. | Une seule réservation ferme ; aucune survente. |
| T20 | Capacité fournisseur expirée ou non vérifiée. | Checkout à la demande bloqué ou capacité reconfirmée avant engagement. |
| T21 | 200 unités vierges, quota illustratif 40, cinq commandes autorisées. | Cinq unités personnalisées au maximum ; reste vierge et traçable. |
| T22 | Paiement confirmé mais fonds ou financement insuffisants. | Aucun feu vert de production irréversible. |
| T23 | Seuil de précommande non atteint ou fournisseur indisponible. | Information, annulation et remboursement selon conditions et droits applicables. |
| T24 | Acheteurs différents dans un regroupement fournisseur. | Ordres et factures identifient chaque acheteur ; pas de dette attribuée fictivement à BIB. |
| T25 | Même réception 3PL livrée deux fois par le bridge. | Un seul mouvement et un seul crédit de stock. |
| T26 | Retour d’invendu en vente privée. | Retour vers la boutique d’origine après contrôle ; aucune nouvelle acquisition. |
| T27 | Rétractation en ligne sur un contrat concerné. | Parcours visible, confirmation et accusé durable avec contenu, date et heure. |
| T28 | Événement dupliqué, ancien, retardé puis indisponibilité du bridge. | Dédoublonnage, ordre des versions, reprise et alerte sans perte de preuve. |
| T29 | Accès à un autre marchand, fournisseur ou environnement et transition Finance par rôle Audit. | Refus serveur, absence de fuite et journal de l’opération autorisée. |
| T30 | Vente boutique EI, vente tierce, audit facturé, avoir et paiement partiel. | GMV et CA séparés, pas de frais à soi-même, dette et solde rapprochés par entité et devise. |

### Conditions de sortie globales

Les refus sont testés par appel direct aux API, en plus des parcours d’écran. Chaque action sensible conserve l’acteur authentifié et les pièces applicables. Les reprises n’exécutent ni double paiement ni double commande. Les documents externes restent limités au périmètre de leur destinataire.

Les tests de cette section s’ajoutent à la recette I32. Ils ne remplacent pas les contrôles de restauration, de séparation sandbox et réel, ni les validations contractuelles et financières propres aux partenaires.

<!-- PAGE -->

## 14 Backlog commun et ordre de réalisation

Le fichier JSON associé contient les tâches détaillées avec identifiant stable, lot, priorité, pôle pilote, dépendances, références de recette et état. Les responsables nominatifs et dates restent à renseigner. Le format sert au transfert vers le suivi de travail après correspondance avec les champs d’Intrabib ; il ne déclenche aucune création automatique de tâche.

| Lot | Sortie à produire | Dépendance |
| --- | --- | --- |
| L0 Règles communes | Identités, états, propriété, barèmes, autorités de données et contrat d’événements. | Référentiels actuels, arbitrages nécessaires documentés. |
| L1 Fournisseurs et audits | Qualification, périmètre, devis accepté, condition de démarrage, rapport et décision par référence. | L0 ; règles contractuelles et financières finalisées. |
| L2 Offre et documents | Échantillon par configuration, calcul du prix, clauses verrouillées, génération et instantanés légaux. | L0 ; modèles et identités vérifiés. |
| L3 Exécution des ventes | Capacité, réservations, précommandes, ordre fournisseur, feu vert et réception 3PL. | L0 ; offres éligibles et flux financiers autorisés. |
| L4 Finance et client | Rapprochements, factures, avoirs, règlements, suivi client, rétractation et reporting. | L1 à L3 selon le parcours ; mise en service conditionnée à la recette globale. |

Le parcours de rétractation et les blocages légaux sont des prérequis de commercialisation même si les autres fonctions de L4 sont livrées ultérieurement. La priorité d’une tâche indique son importance pour la mise en service, sans annuler ses dépendances.

### Coordination Git

La tâche centrale existante [I45](https://github.com/Txss-17/bib_intranet/issues/45) conserve le suivi des décisions fournisseurs et audits. La tâche [I32](https://github.com/Txss-17/bib_intranet/issues/32) conserve le suivi de préproduction et de recette croisée. Les changements de code doivent être rattachés au lot et aux tests concernés, avec preuve d’exécution avant clôture.

Le même cahier et le même backlog sont préparés dans les deux dépôts afin que Platform et Intrabib appliquent les mêmes règles. Toute divergence future entre copies doit être résolue avant de développer les contrats partagés.

### Validation de chaque livraison

Le responsable métier vérifie le comportement et les cas d’exception. Technique vérifie API, autorisations, intégration et reprise. Finance valide les effets financiers. La gouvernance juridique contrôle les modèles concernés. Direction tranche les arbitrages restants et la mise en service sur pièces de recette.

Les clauses ou paramètres non finalisés empêchent uniquement les fonctions dépendantes identifiées. Le travail de conception, de développement isolé et de test peut progresser sur les autres tâches.

<!-- PAGE -->

## 15 Sources et repères de lecture

### Référentiels documentaires

D01 — BIB-00 Registre des paramètres v1.6 synchronisé et BIB-00bis Registre des décisions v1.3 synchronisé, 4 novembre 2026. Les statuts et réserves de validation de ces registres sont conservés.

D02 — GOV-LEGAL Gouvernance juridique des boutiques v1.0 et modèles JUR-M01, M02, C01, C02, B01, B02 et B03 référencés par les registres. Le cahier ne republie ni ne finalise ces modèles.

D03 — BIB-19 Validation catalogue produits v2.0, BIB-21 Tarification produits et marges v1.0, BIB-23 Commande et précommande v2.0, BIB-25 Interface fournisseurs v1.0, BIB-30 Règlements et rapprochements v1.0 et BIB-31 Flux finance et fiscalité v2.0, dernières versions consultées du 4 novembre 2026.

D04 — BIB Contrat cadre fournisseur v5.4 consolidé, exemplaire intitulé BIB_Contrat_Cadre_Fournisseur_v5_4_Consolide(1).docx, articles 3, 4 et 7, annexe C et annexes D et E. Son statut de projet et ses incohérences de version nécessitent finalisation avant signature.

### Versions de code consultées

P — [Txss-17 bib_platform](https://github.com/Txss-17/bib_platform/tree/dc1dd979127f76c9c521f6249e1f23a4effa3855), révision dc1dd979127f76c9c521f6249e1f23a4effa3855.

I — [Txss-17 bib_intranet](https://github.com/Txss-17/bib_intranet/tree/80bddb3cc977e6875fe8cbce12ef30f7d036ff83), révision 80bddb3cc977e6875fe8cbce12ef30f7d036ff83.

P01 — docs/merchant-on-demand-procurement-stock-model-2026-11-04.md ; P02 — src/hooks/useSampleValidation.ts ; P03 — supabase/functions/create-storefront-checkout/index.ts.

P04 — src/pages/BoutiqueLegalPages.tsx ; P05 — src/lib/legalDocumentVersions.ts et .js, src/contexts/AuthContext.tsx et drizzle/migrations/0007_merchant_legal_acceptances.sql.

P06 — supabase/functions/_shared/bridge-contract.ts ; inventaire des migrations Drizzle et des tests de bridge.

I01 — src/pages/modules/audit/SupplierAudits.tsx et src/hooks/useAuditSupplierLiaison.ts ; I02 — drizzle/migrations/0079_finance_invoice_register.sql.

I03 — docs/intranet-completion.md et AGENTS.md ; I04 — supabase/functions/platform-bridge/index.ts et docs/cross-pole-supplier-owned-inventory-2026-11-04.md.

### Vérifications externes du 4 novembre 2026

S01 — [Code de la consommation article L221 21](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053310520) — rétractation en ligne pour les contrats concernés.

S02 — [Code de la consommation article D221 5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053303365) — présentation, confirmation et accusé sur support durable.

S03 — [Stripe Understanding Connect account balances](https://docs.stripe.com/connect/account-balances) — distinction des soldes, allocation par compte et reprise des échecs de transfert.


## Suivi du premier lot de code

Le diagnostic ci-dessus décrit les révisions sources citées, avant développement. Le premier lot fournisseur/audit est maintenant implémenté et testé localement. Son périmètre exact, ses limites, ses vérifications et les conditions de mise en service sont décrits dans [la note de livraison](supplier-audit-commercial-workflow-2026-11-04.md). Le backlog JSON version 1.1 distingue les tâches implémentées localement, les éléments partiels et les travaux non commencés. Aucune recette de préproduction ni mise en service globale n’est déclarée accomplie.


## Suivi du deuxième lot de code

Le registre et l’assemblage serveur JUR-B01/B02/B03, la vérification des identités, les contrôles SQL de publication/commande et les preuves de version sont implémentés et testés localement. [La note du lot juridique](store-legal-governance-2026-11-04.md) détaille les validations humaines requises, les transmissions et leurs reprises, le déploiement coordonné et les limites restantes. Le backlog version 1.2 conserve la distinction entre code livré, éléments partiels et recette non exécutée.


## Mise à jour du flux marchand, fournisseur et BIB — 5 novembre 2026

Le choix d’intermédiation transparente et de Destination charges, le prix global produit/livraison/commission et le fournisseur identifié sur le devis sont précisés dans [le modèle de flux et son plan de mise en service](merchant-supplier-flow-2026-11-05.md). Les demandes, devis, revue Finance indépendante, acceptation exacte, contrôles PSP, rapprochements et couverture avant production ont leur code et leurs tests isolés. Le montage Connect est choisi ; sa configuration réelle, les mandats et la recette restent à valider. Les capacités/précommandes, la réception 3PL complète et la comptabilité consolidée restent ouvertes. Ce complément prévaut sur les anciennes mentions « montage à choisir » sans déclarer la mise en production réalisée.
