# Support et Customer Success

La migration `0047_support_ticket_workflow.sql` et les pages Support complètent le traitement des tickets sur la table existante `support_tickets`. Les anciennes URL restent valables.

## Traitement des tickets

Un ticket commence ouvert. Le formulaire propose des agents Connect actifs, habilités à lire et modifier les tickets, dans le même environnement réel/test. Il rattache un compte client parmi les lignes actuellement accessibles au collaborateur. Une nouvelle association à un compte non lisible est refusée ; un lien historique inchangé ne bloque pas le travail d’un agent attribué qui ne peut plus consulter les informations commerciales du compte.

Les responsables, auteurs et référents disposant de `validate` peuvent modifier le contenu des tickets actifs avec le droit `update`. Un agent peut se prendre un ticket non attribué, sans profiter de cette action pour modifier simultanément son contenu. Les transitions relèvent de l’agent attribué ou du référent habilité.

| État actuel | Transitions autorisées |
| --- | --- |
| Ouvert | En cours, en attente, résolu. |
| En cours | En attente, résolu. |
| En attente | En cours, résolu. |
| Résolu | Fermé ou rouvert avec motif. |
| Fermé | Rouvert avec motif par un référent habilité. |

La résolution exige un compte rendu. Le serveur fixe les dates de résolution et de fermeture ; le contenu d’un ticket résolu ou fermé est verrouillé. Une réouverture conserve la décision précédente dans le journal et retire les métadonnées de résolution courante. L’archivage exige `delete` et une responsabilité sur la fiche ; il conserve les données, les notes et le journal. Le navigateur ne peut pas supprimer physiquement un ticket.

Chaque écriture depuis l’intranet transmet la révision d’origine ; les synchronisations de service avancent également cette révision. Une modification périmée échoue au lieu d’écraser le travail d’un collègue. Une création réessayée après interruption conserve la même clé jusqu’à confirmation. Le formulaire reste ouvert avec ses données en cas d’échec, puis se ferme après confirmation du serveur. Les attributions et changements d’état génèrent des notifications dans l’intranet.

Les notes internes sont horodatées par le serveur et append-only. Les notes et l’historique sont consultables par pages de 50 événements, y compris après archivage. Les liens de notification ouvrent directement le ticket ; la liste des comptes clients propose un lien vers les tickets de ce compte. La transmission au Product reste une demande explicite du collaborateur.

## Droits et intégrations

Les droits enregistrés priment sur la matrice de secours. La lecture des tickets est contrôlée indépendamment des autres pages Support : un droit sur les escalades ne contourne pas un refus explicite sur les tickets. Les notes et l’historique restent soumis à l’accès actuel au ticket.

Le registre des tables sépare désormais les pages donnant un contexte en lecture (`read_page_ids`) des pages autorisant les mutations métier. Support peut consulter le contexte client permis par ses politiques de portefeuille existantes ; cela ne lui accorde pas la modification des comptes commerciaux.

Les tickets, discussions, responsables et indicateurs sont cloisonnés entre données réelles et tests. Les interfaces de synchronisation privilégiées conservent leur chemin de service. Un client Platform peut ouvrir une demande sur son propre compte ; cette création lie l’auteur et l’horodatage à l’identité authentifiée et ne permet ni d’attribuer un agent interne ni de fabriquer une résolution. Les notes internes et la gestion du ticket restent réservées au personnel Connect habilité.

## Indicateurs

Le tableau Support présente les tickets actifs et un **délai moyen de résolution**, calculé à partir des dates de création et de résolution des tickets résolus ou fermés non archivés. Ce délai ne mesure pas une première réponse au client. Les durées absentes, négatives ou futures sont exclues ; l’interface affiche le nombre d’observations et « — » en l’absence de durée valide.

Les indicateurs Customer Success portent sur tous les comptes accessibles, lus par pages ordonnées. Ils distinguent comptes suivis, abonnements actifs, risques élevés et paiements en retard. La moyenne des notes exclut les valeurs absentes ou invalides. Le précédent MRR déduit d’un chiffre d’affaires divisé par douze est retiré : la table de comptes ne décrit pas un revenu d’abonnement mensuel. Une erreur de chargement est présentée comme une erreur et ne devient pas un total nul.

## Vérification

Le scénario `tests/support-tickets/workflow.sql` couvre les permissions et leur révocation, les responsabilités, les transitions, les dates serveur, les créations réessayées, les révisions périmées, l’archivage, le cloisonnement réel/test, les politiques de portefeuille, les pages de journal et notes, les durées manquantes ou incohérentes et la frontière entre client Platform et personnel Connect.

Les tests Node `tests/intranet/support-ticket-client.test.mjs` exercent le formulaire, les reprises, les appels du client, les transitions, les indicateurs et la pagination au-delà de 1 000 lignes. Les tests n’utilisent aucun service externe.
