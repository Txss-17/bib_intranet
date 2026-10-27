# Revue BIB des réapprovisionnements Platform

Les demandes marchandes sont visibles dans **Fournisseurs → Produits validés**, sous les dossiers de personnalisation. La vue **À examiner** contient les demandes au statut requested ; l’historique montre les décisions et les statuts reçus de Platform. Le chargement, les erreurs et la reprise après échec sont explicites ; les listes sont actualisées toutes les 30 secondes et restent filtrées par le portefeuille produit.

Une approbation ou un refus avec motif est transmis au marchand. Cette action ne crédite aucun stock, ne confirme aucune réception et ne crée aucun achat fournisseur. Les ordres de restock du portail fournisseur gardent leur processus propre.

## Contrat et droits

Platform exporte restock_requests avec les identifiants de demande, produit marchand, référence catalogue, produit Intranet et boutique, le nom du produit/de la boutique, la quantité, le MOQ enregistré, le statut, les notes/commentaires, la version et les dates. Le bridge exige un tableau présent, des identifiants valides et la correspondance exacte products.id + products.platform_id. Une donnée invalide ou non rattachée produit un échec de synchronisation ; aucun résultat réussi ne masque ce rejet.

Le miroir platform_stock_restock_requests est lisible uniquement selon can_access_product_customization. Seul le service peut l’écrire. La revue utilise le JWT du collaborateur pour can_manage_product_customization avant tout appel privilégié Platform. Les contrôles visuels utilisent les permissions enregistrées de la page Produits validés.

L’action review_restock appelle intranet-import avec type restock_review et data {request_id, version, status: approved|rejected, comment}. Platform est la source de vérité : le bridge valide la ligne autoritative renvoyée dans request puis l’enregistre, en conservant uniquement les noms et l’identifiant Intranet déjà rattachés. Une version obsolète reçoit 409. La répétition d’une décision identique peut reprendre une confirmation perdue ; une synchronisation tardive ne peut rétablir un ancien statut. Le refus exige un motif de 2000 caractères au plus.

## Intégration et vérifications

Prérequis Intranet : migration 0029_product_customization_bridge.sql puis 0030_platform_restock_review.sql. Prérequis Platform : migration 0023_stock_restock_review.sql, export restock_requests et import restock_review correspondants. Intégrer les deux changements coordonnés, vérifier les migrations déjà appliquées, puis appliquer uniquement les nouvelles migrations et déployer les fonctions et interfaces correspondantes. Ne pas rejouer tous les historiques SQL. Le secret du bridge reste côté serveur.

Cette PR prépare le code et les migrations ; elle ne modifie pas la base publiée et ne déploie aucune fonction.

Les contrôles GitHub exécutent npm run test:restock, les tests PostgreSQL tests/restock/mirror.sql (droits et périmètres réels de 0029, idempotence et protection contre les retours de version), le typage de l’application et la compilation. Le script SQL doit être exécuté dans une base de test vide : il crée des rôles et des tables de fixture dans une transaction annulée.
