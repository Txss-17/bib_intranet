# Intrabib — Parcours après candidature fournisseur et logistique — 7 novembre 2026

## Principe retenu
Le recrutement, la qualification et la conclusion de partenariats sont ouverts sans quota global. L'activation des services suit des vagues opérationnelles limitées, actuellement définies par la PR #56, **distinctes** des étapes de candidature et de contrat.

## Fournisseur
1. Candidature reçue et étude initiale : identification du fournisseur, informations légales et premiers produits proposés.
2. **Avant contrat**, réception du catalogue proposé et étude préliminaire pour décider si la gamme peut être éligible à BIB. Le catalogue reçu à ce stade ne vaut ni admission produit ni publication.
3. Présélection et validation juridique du contrat fournisseur.
4. Après signature ou validation contractuelle, préparation de l'accès à l'interface partenaire et **preuve séparée de transmission et de réception des informations d'accès**. Le registre enregistre la preuve, sans créer ni distribuer de secret.
5. Réception du catalogue complet et des pièces produit : description, SKU, déclarations, certificats, notices, fiches de conformité et preuves additionnelles selon la catégorie.
6. Étude SKU par SKU : éligible, non éligible, complément demandé ou examen en cours. Les références documentaires et de certification sont conservées comme **matière première de l'audit documentaire**, sans considérer un simple dossier reçu comme un audit approuvé.
7. Après décision et audit validé par les pôles habilités, admission et publication selon le circuit existant, avec affichage des produits admis dans l'interface fournisseur. **La synchronisation vers le portail fournisseur n'est pas implémentée par cette PR** : ajouter une lecture exclusivement des SKU admis, pas de l'ensemble des produits candidats.
8. Sélection éventuelle pour une vague pilote : concerne le fournisseur canonique `suppliers.id`, non la candidature `supplier_applications.id`. Le portefeuille reste ouvert.

## Logistique
1. Formulaire initial : identité, transport, entrepôt, SLA, couverture géographique, assurance, certifications.
2. Prise de contact formalisée pour présenter le fonctionnement et les attentes de BIB.
3. Transmission d'une **fiche des besoins de services** : transport, stockage, picking/packing, tracking, retours, incidents, délais, zones, API, informations financières et conditions de service.
4. Accord du partenaire sur les besoins ou demande d'ajustements ; preuve de la version acceptée.
5. Après accord opérationnel de principe, **réception du contrat et des CGS/SLA proposés par le logisticien**, avec référence/version de chaque document.
6. **Revue Juridique, Logistique et Finance** : tarifs, garanties, stockage et propriété des stocks, responsabilité, assurance, données personnelles, SLA, durée et sortie. Toute réserve déclenche une négociation tracée. Les contrôles doivent être formalisés et la décision validée.
7. **Signature du contrat du prestataire** (ou d'un accord alternatif juridiquement opposable validé), archivage de la version signée, signataires et dates. BIB ne rédige pas systématiquement de contrat-cadre logistique propre.
6. Transmission documentée des informations d'accès au portail ; **aucun mot de passe ni jeton en clair dans Intrabib**. L'ouverture de l'accès documentaire n'autorise pas à elle seule l'affectation de commandes.
7. Rattachement contrôlé de l'identifiant `partner_onboarding_submissions.id` de Platform au partenaire `logistics_partners.id` d'Intrabib.
8. Activation opérationnelle éventuelle : sélection pilote approuvée, contrôles juridiques et Finance, capacités, habilitations, contrat, assurance, tests techniques et Go/No-Go. La PR #56 apporte un garde-fou limité au bridge `assign_shipment`.

## Code de ce lot
- `drizzle/migrations/0090_partner_postapplication_workflows.sql` : dossiers fournisseurs et logistiques, étapes ordonnées, justificatifs, registres produit par SKU et permissions RLS. Les actions RPC échouent si la progression est incohérente.
- `src/components/operations/PartnerPostApplicationWorkflow.tsx` : traçabilité des étapes et des pièces ; aucune activation directe.
- `SupplierApplicationDetail.tsx` : onglet « Après candidature ».
- `Partners.tsx` : sélection d'un partenaire et parcours logistique.
- Tests de cohérence dans `tests/intranet/partner-postapplication-workflows.test.mjs`.

## Points non validés / nécessaires avant préproduction
- **Migration ordonnée** : la PR #56 porte une migration 0089 non encore fusionnée, tandis que celle-ci introduit la 0090. Ne pas appliquer la 0090 isolément et vérifier le journal Drizzle, la structure de la base cible et les conflits de branches.
- **Dossiers Platform** : aucun raccordement automatisé garanti entre les deux types de candidatures et leurs objets canoniques. Valider la correspondance d'ID au serveur avant tout effet réel.
- **Envoi d'accès** : utiliser le système de jetons/OTP existant avec notification serveur et preuve d'invitation, et jamais un lien sensible conservé dans une note. Non réalisé dans cette PR.
- **Publication fournisseur** : conserver les contrôles existants de validation SKU, audit, documents et environnement. La liste de produits éligibles dans Intrabib n'est pas encore la liste publique publiée.
- **Relecture et séparation des rôles** : les changements de statut sont sous permission de pôle, mais une contre-validation métier indépendante de la signature contractuelle reste à relier au modèle documentaire.
- **Données d'essai** : vérifier RLS et séparation `test_account` avec de vrais utilisateurs de préproduction, y compris les accès refusés.
- **Contrôles de sécurité** : réaliser une revue SQL de la migration, des chemins de publication, des profils de test et du journal de preuves ; tester les opérations concurrentes, reprises, erreurs d'export et rollback.
- **Aucun déploiement** ni migration distante dans ce lot.
