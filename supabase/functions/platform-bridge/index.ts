import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3'

const json = (body: unknown, status = 200) =>
  new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  )

const Body = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('status'),
  }),

  z.object({
    action: z.literal('pull'),
    since: z.string().datetime().optional(),
  }),

  z.object({
    action: z.literal('push_product'),
    product_id: z.string().uuid(),
  }),

  z.object({
    action: z.literal('push_shop_status'),
    shop_id: z.string().uuid(),
  }),
])


/**
 * Statuts BIB Platform → Intranet.
 *
 * Il n'existe plus de statut test/trial côté Intranet.
 */
const SHOP_STATUS: Record<string, string> = {
  draft: 'draft',
  pending: 'application',
  application: 'application',
  review: 'review',

  active: 'active',
  published: 'active',

  inactive: 'inactive',

  suspended: 'suspended',

  closed: 'closed',
  archived: 'closed',
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return json(
      { error: 'Method not allowed' },
      405,
    )
  }


  const url = Deno.env.get('SUPABASE_URL')!

  const admin = createClient(
    url,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )


  // ==========================================================
  // AUTHENTIFICATION
  // ==========================================================

  const token = req.headers
    .get('Authorization')
    ?.replace('Bearer ', '')

  if (!token) {
    return json(
      { error: 'Unauthorized' },
      401,
    )
  }

  const {
    data: userResult,
    error: userError,
  } = await admin.auth.getUser(token)

  if (userError || !userResult.user) {
    return json(
      { error: 'Unauthorized' },
      401,
    )
  }

  const uid = userResult.user.id


  const [
    { data: leadership },
    { data: profile },
  ] = await Promise.all([
    admin.rpc(
      'is_leadership',
      {
        _user_id: uid,
      },
    ),

    admin
      .from('profiles')
      .select('poles')
      .eq('id', uid)
      .maybeSingle(),
  ])


  const poles: string[] =
    (profile?.poles as string[]) ?? []


  // ==========================================================
  // PARSE
  // ==========================================================

  const parsed = Body.safeParse(
    await req.json().catch(() => null),
  )

  if (!parsed.success) {
    return json(
      {
        error:
          parsed.error.flatten().fieldErrors,
      },
      400,
    )
  }

  const body = parsed.data


  // ==========================================================
  // AUTORISATIONS
  // ==========================================================

  const canPull =
    Boolean(leadership) ||
    poles.includes('tech') ||
    poles.includes('marketplace')


  const canPush =
    Boolean(leadership) ||
    poles.includes('tech') ||
    poles.includes('marketplace') ||
    poles.includes('supplier')


  const allowed =
    body.action === 'pull'
      ? canPull
      : canPush


  if (!allowed) {
    return json(
      { error: 'Forbidden' },
      403,
    )
  }


  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const base =
    Deno.env.get(
      'BIB_PLATFORM_FUNCTIONS_URL',
    )

  const secret =
    Deno.env.get(
      'BIB_PLATFORM_BRIDGE_SECRET',
    )

  const configured =
    Boolean(base && secret)


  if (body.action === 'status') {
    return json({
      configured,
    })
  }


  if (!configured) {
    return json(
      {
        error:
          'Liaison B.I.B Platform non configurée',
      },
      412,
    )
  }


  // ==========================================================
  // APPEL PLATFORM
  // ==========================================================

  const callPlatform = async (
    fn: string,
    payload: unknown,
  ) => {
    const response = await fetch(
      `${base!.replace(/\/$/, '')}/${fn}`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'x-bib-bridge-key':
            secret!,
        },

        body: JSON.stringify(payload),
      },
    )

    const text =
      await response.text()

    if (!response.ok) {
      throw new Error(
        `${fn} ${response.status}: ${text.slice(
          0,
          500,
        )}`,
      )
    }

    return JSON.parse(text)
  }

  // ------------------------------------------------------
// RAPPORT DE RÉCEPTION
// ------------------------------------------------------

const financialKeys = [
  'subscriptions',
  'commissions',
  'payments',
  'fees',
  'refunds',
  'payouts',
] as const

const receivedFinancials =
  financialKeys.reduce(
    (total, key) =>
      total +
      ((data[key] ?? []) as unknown[]).length,
    0,
  )

const receivedFavorites =
  Array.isArray(
    data.customer_favorites,
  )
    ? data.customer_favorites
    : []

const receivedFavoriteProducts =
  receivedFavorites.filter(
    (favorite: any) =>
      favorite.favorite_type ===
      'product',
  ).length

const receivedFavoriteBoutiques =
  receivedFavorites.filter(
    (favorite: any) =>
      favorite.favorite_type ===
      'boutique',
  ).length

syncDetails.pull = {
  received: {
    merchants:
      (data.merchants ?? []).length,

    boutiques:
      (data.boutiques ?? []).length,

    orders:
      (data.orders ?? []).length,

    tickets:
      (data.tickets ?? []).length,

    supplier_applications:
      (
        data.supplier_applications ??
        []
      ).length,

    financials:
      receivedFinancials,

    customer_favorites: {
      total:
        receivedFavorites.length,

      products:
        receivedFavoriteProducts,

      boutiques:
        receivedFavoriteBoutiques,
    },
  },
}
  
  // ==========================================================
  // SYNC RUN
  // ==========================================================

  const {
    data: run,
  } = await admin
    .from('platform_sync_runs')
    .insert({
      direction:
        body.action === 'pull'
          ? 'pull'
          : 'push',

      action: body.action,

      triggered_by: uid,
    })
    .select('id')
    .single()


  const errors: string[] = []

  let count = 0

  const now =
    new Date().toISOString()
  
  const syncStartedAt = Date.now()

  const syncDetails: Record<string, unknown> = {}

  const notifications:
    Record<string, unknown>[] = []


  const notify = (
    pole: string,
    title: string,
    message: string,
    actionUrl: string,
    type = 'info',
  ) => {
    notifications.push({
      pole_id: pole,
      title,
      message,
      action_url: actionUrl,
      type,
    })
  }


  try {

    // ========================================================
    // PULL
    // ========================================================

    if (body.action === 'pull') {

      const data =
        await callPlatform(
          'intranet-export',
          {
            since:
              body.since ??
              null,
          },
        )

    // ------------------------------------------------------
// FIN DE SYNCHRONISATION
// ------------------------------------------------------
//
// On conserve un rapport détaillé de l'exécution afin que
// l'interface BIB Intranet puisse afficher précisément
// ce qui a été reçu et traité.
//
// Le compteur "items" reste compatible avec l'ancien
// fonctionnement.
//
// Le champ "details" contient désormais le détail par
// catégorie ainsi que le rapport spécifique aux favoris.
// ------------------------------------------------------

const finishedAt = new Date().toISOString()

syncDetails.summary = {
  items_count: count,
  errors_count: errors.length,
  duration_ms:
    Date.now() - syncStartedAt,
}


// ------------------------------------------------------
// Enregistrement du résultat de synchronisation
// ------------------------------------------------------

await admin
  .from('platform_sync_runs')
  .update({
    status:
      errors.length > 0
        ? 'completed_with_errors'
        : 'completed',

    finished_at:
      finishedAt,

    items:
      count,

    error:
      errors.length
        ? errors.join('\n')
        : null,

    details:
      syncDetails,
  })
  .eq(
    'id',
    runId,
  )

      // ------------------------------------------------------
      // 1. MARCHANDS
      // ------------------------------------------------------

      for (
        const merchant
        of data.merchants ?? []
      ) {

        const row = {
          platform_id:
            merchant.id,

          company_name:
            merchant.company_name ??
            merchant.full_name ??
            merchant.email ??
            'Marchand',

          contact_name:
            merchant.full_name ??
            null,

          contact_email:
            merchant.email ??
            'inconnu@platform',

          subscription_status:
            merchant.subscription_status ??
            null,

          platform_synced_at:
            now,
        }


        const {
          data: existing,
        } = await admin
          .from('user_accounts')
          .select('id')
          .eq(
            'platform_id',
            merchant.id,
          )
          .maybeSingle()


        const result =
          existing

            ? await admin
                .from('user_accounts')
                .update(row)
                .eq(
                  'id',
                  existing.id,
                )
                .select('id')
                .single()

            : await admin
                .from('user_accounts')
                .insert(row)
                .select('id')
                .single()


        if (result.error) {

          errors.push(
            `marchand ${
              row.company_name
            }: ${
              result.error.message
            }`,
          )

        } else {

          count++

          if (!existing) {

            notify(
              'marketplace',
              'Nouveau marchand',
              row.company_name,
              '/pole/marketplace/merchants',
            )

          }

        }

      }


      // ------------------------------------------------------
      // 2. INDEX MARCHANDS
      // ------------------------------------------------------

      const {
        data: merchantRows,
      } = await admin
        .from('user_accounts')
        .select(
          'id, platform_id',
        )
        .not(
          'platform_id',
          'is',
          null,
        )


      const merchantMap =
        new Map<
          string,
          string
        >()


      for (
        const merchant
        of merchantRows ?? []
      ) {

        if (
          merchant.platform_id
        ) {

          merchantMap.set(
            merchant.platform_id,
            merchant.id,
          )

        }

      }


      // ------------------------------------------------------
      // 3. BOUTIQUES
      // ------------------------------------------------------

      const shopMap =
        new Map<
          string,
          string
        >()


      for (
        const boutique
        of data.boutiques ?? []
      ) {

        const merchantId =
          merchantMap.get(
            boutique.user_id,
          ) ?? null


        const row = {
          platform_id:
            boutique.id,

          name:
            boutique.name,

          slug:
            boutique.slug ??
            null,

          merchant_id:
            merchantId,

          category:
            boutique.category ??
            null,

          subscription_plan:
            boutique.subscription_plan ??
            null,

          status:
            SHOP_STATUS[
              boutique.status
            ] ??
            'review',

          platform_synced_at:
            now,

          app_origin:
            'platform',
        }


        const {
          data: existing,
        } = await admin
          .from('shops')
          .select('id')
          .eq(
            'platform_id',
            boutique.id,
          )
          .maybeSingle()


        const result =
          existing

            ? await admin
                .from('shops')
                .update(row)
                .eq(
                  'id',
                  existing.id,
                )
                .select('id')
                .single()

            : await admin
                .from('shops')
                .insert({
                  ...row,

                  shop_code:
                    `BOS-${String(
                      boutique.id,
                    )
                      .slice(0, 8)
                      .toUpperCase()}`,
                })
                .select('id')
                .single()


        if (result.error) {

          errors.push(
            `boutique ${
              boutique.name
            }: ${
              result.error.message
            }`,
          )

        } else {

          shopMap.set(
            boutique.id,
            result.data.id,
          )

          count++


          if (!existing) {

            notify(
              'marketplace',
              'Nouvelle boutique à examiner',
              boutique.name,
              '/pole/marketplace/stores',
            )

          }

        }

      }

      // ------------------------------------------------------
      // 3 BIS. FAVORIS CLIENTS
      // ------------------------------------------------------
      //
      // BIB Platform reste la source de vérité.
      // L'Intranet reçoit un snapshot complet.
      //
      // IMPORTANT :
      // shopMap ne doit pas dépendre uniquement des boutiques
      // présentes dans le pull incrémental courant.
      //
      // Une boutique peut être inchangée sur BIB Platform,
      // donc absente de data.boutiques, tout en étant déjà
      // synchronisée dans l'Intranet.
      //
      // On recharge donc toutes les boutiques locales liées
      // à BIB Platform avant de résoudre les favoris.
      // ------------------------------------------------------
      
      const {
        data: knownFavoriteShops,
        error: knownFavoriteShopsError,
      } = await admin
        .from('shops')
        .select('id, platform_id')
        .not(
          'platform_id',
          'is',
          null,
        )
      
      if (knownFavoriteShopsError) {
        errors.push(
          `favoris clients — index boutiques : ${knownFavoriteShopsError.message}`,
        )
      } else {
        for (
          const shop
          of knownFavoriteShops ?? []
        ) {
          if (
            shop.platform_id
          ) {
            shopMap.set(
              shop.platform_id,
              shop.id,
            )
          }
        }
      }
      
      
      // ------------------------------------------------------
      // Snapshot des favoris
      // ------------------------------------------------------
      //
      // Les favoris sont synchronisés en snapshot complet.
      //
      // Pourquoi ?
      // customer_product_favorites et
      // customer_boutique_favorites ne possèdent pas de
      // deleted_at ni de journal de changements permettant
      // de reconstruire proprement les suppressions avec
      // un simple paramètre "since".
      //
      // On doit donc remplacer le snapshot Platform précédent
      // par l'état actuel retourné par Platform.
      //
      // IMPORTANT :
      // On valide d'abord customer_favorites.
      // Une réponse Platform invalide ne doit JAMAIS entraîner
      // la suppression du snapshot local existant.
      // ------------------------------------------------------
      
      const favorites =
        data.customer_favorites
      
      if (
        !Array.isArray(
          favorites,
        )
      ) {
        throw new Error(
          'Export B.I.B Platform invalide : customer_favorites absent ou non-tableau',
        )
      }
      syncDetails.favorites = {
  mode:
    'full_snapshot',

  received:
    favorites.length,

  products:
    favorites.filter(
      (favorite: any) =>
        favorite.favorite_type ===
        'product',
    ).length,

  boutiques:
    favorites.filter(
      (favorite: any) =>
        favorite.favorite_type ===
        'boutique',
    ).length,

  snapshot_replaced:
    false,
}
      
      // ------------------------------------------------------
      // Nettoyage du snapshot précédent
      // ------------------------------------------------------
      
      const {
        error: deleteFavoritesError,
      } = await admin
        .from(
          'marketplace_customer_favorites',
        )
        .delete()
        .eq(
          'source',
          'platform',
        )
      
      if (deleteFavoritesError) {
        errors.push(
          `favoris clients — nettoyage : ${deleteFavoritesError.message}`,
        )
      } else {
      
        // ----------------------------------------------------
        // Construction du nouveau snapshot
        // ----------------------------------------------------
      
        const favoriteRows =
          favorites.map(
            (favorite: any) => {
      
              const platformBoutiqueId =
                favorite.platform_boutique_id ??
                (
                  favorite.favorite_type ===
                  'boutique'
                    ? favorite.target_id
                    : null
                )
      
              return {
                platform_user_id:
                  favorite.user_id,
      
                favorite_type:
                  favorite.favorite_type,
      
                platform_target_id:
                  favorite.target_id,
      
                platform_boutique_id:
                  platformBoutiqueId,
      
                target_name:
                  favorite.target_name ??
                  null,
      
                target_sku:
                  favorite.target_sku ??
                  null,
      
                shop_id:
                  platformBoutiqueId
                    ? (
                        shopMap.get(
                          platformBoutiqueId,
                        ) ?? null
                      )
                    : null,
      
                created_at:
                  favorite.created_at ??
                  now,
      
                platform_synced_at:
                  now,
      
                source:
                  'platform',
              }
            },
          )
      
      
        // ----------------------------------------------------
        // Insertion par lots
        // ----------------------------------------------------
      
        const chunkSize = 500
      
        for (
          let i = 0;
          i < favoriteRows.length;
          i += chunkSize
        ) {
      
          const chunk =
            favoriteRows.slice(
              i,
              i + chunkSize,
            )
      
          if (!chunk.length) {
            continue
          }
      
          const {
            error,
          } = await admin
            .from(
              'marketplace_customer_favorites',
            )
            .insert(
              chunk,
            )
      
          if (error) {
            errors.push(
              `favoris clients : ${error.message}`,
            )
      
            break
          }
      
          count +=
            chunk.length
        }
      }
      
      // ------------------------------------------------------
      // 4. COMMANDES
      // ------------------------------------------------------

      if (
        (data.orders ?? []).length
      ) {

        const {
          data: knownShops,
        } = await admin
          .from('shops')
          .select(
            'id, platform_id',
          )
          .not(
            'platform_id',
            'is',
            null,
          )


        for (
          const shop
          of knownShops ?? []
        ) {

          if (
            shop.platform_id
          ) {

            shopMap.set(
              shop.platform_id,
              shop.id,
            )

          }

        }

      }


      for (
        const order
        of data.orders ?? []
      ) {

        const shopId =
          shopMap.get(
            order.boutique_id,
          )


        if (!shopId) {

          errors.push(
            `commande ${
              order.order_number
            }: boutique inconnue`,
          )

          continue

        }


        const row = {
          platform_id:
            order.id,

          order_number:
            order.order_number ??
            `BOS-${String(
              order.id,
            ).slice(0, 8)}`,

          shop_id:
            shopId,

          total_amount:
            order.amount ??
            0,

          status:
            order.payment_status ===
            'paid'

              ? (
                  order.logistics_status ??
                  'paid'
                )

              : (
                  order.payment_status ??
                  'pending'
                ),

          current_stage:
            order.logistics_status ??
            null,

          region:
            order.market ??
            null,

          platform_synced_at:
            now,
        }


        const {
          data: existing,
        } = await admin
          .from('orders')
          .select('id')
          .eq(
            'platform_id',
            order.id,
          )
          .maybeSingle()


        const {
          shop_id,
          ...updateRow
        } = row


        const result =
          existing

            ? await admin
                .from('orders')
                .update(updateRow)
                .eq(
                  'id',
                  existing.id,
                )

            : await admin
                .from('orders')
                .insert(row)


        if (result.error) {

          errors.push(
            `commande ${
              row.order_number
            }: ${
              result.error.message
            }`,
          )

        } else {

          count++

        }

      }


      // ------------------------------------------------------
      // 5. TICKETS
      // ------------------------------------------------------

      for (
        const ticket
        of data.tickets ?? []
      ) {

        const row = {
          platform_id:
            ticket.id,

          subject:
            ticket.subject ??
            'Ticket plateforme',

          description:
            ticket.message ??
            ticket.description ??
            null,

          status:
            ticket.status ??
            'open',

          priority:
            ticket.priority ??
            'medium',

          platform_synced_at:
            now,
        }


        const {
          data: existing,
        } = await admin
          .from('support_tickets')
          .select('id')
          .eq(
            'platform_id',
            ticket.id,
          )
          .maybeSingle()


        const result =
          existing

            ? await admin
                .from('support_tickets')
                .update(row)
                .eq(
                  'id',
                  existing.id,
                )

            : await admin
                .from('support_tickets')
                .insert(row)


        if (result.error) {

          errors.push(
            `ticket: ${
              result.error.message
            }`,
          )

        } else {

          count++

        }

      }


      // ------------------------------------------------------
      // 6. FOURNISSEURS
      // ------------------------------------------------------

      for (
        const application
        of data.supplier_applications ?? []
      ) {

        const row = {
          platform_id:
            application.id,

          name:
            application.company_name ??
            application.name ??
            'Candidature fournisseur',

          contact_name:
            application.contact_name ??
            null,

          contact_email:
            application.contact_email ??
            application.email ??
            null,

          email:
            application.contact_email ??
            application.email ??
            null,

          phone:
            application.contact_phone ??
            application.phone ??
            null,

          country:
            application.country ??
            null,

          notes:
            application.message ??
            application.description ??
            null,

          platform_synced_at:
            now,
        }


        const {
          data: existing,
        } = await admin
          .from('suppliers')
          .select('id')
          .eq(
            'platform_id',
            application.id,
          )
          .maybeSingle()


        const result =
          existing

            ? await admin
                .from('suppliers')
                .update(row)
                .eq(
                  'id',
                  existing.id,
                )

            : await admin
                .from('suppliers')
                .insert({
                  ...row,
                  status: 'pending',
                  audit_status: 'pending',
                })


        if (result.error) {

          errors.push(
            `candidature ${
              row.name
            }: ${
              result.error.message
            }`,
          )

        } else {

          count++

          if (!existing) {

            notify(
              'supplier',
              'Nouvelle candidature fournisseur',
              row.name,
              '/pole/supplier/applications',
            )

          }

        }

      }


      // ------------------------------------------------------
      // 7. FLUX FINANCIERS
      // ------------------------------------------------------

      if (!shopMap.size) {

        const {
          data: known,
        } = await admin
          .from('shops')
          .select(
            'id, platform_id',
          )
          .not(
            'platform_id',
            'is',
            null,
          )


        for (
          const shop
          of known ?? []
        ) {

          if (
            shop.platform_id
          ) {

            shopMap.set(
              shop.platform_id,
              shop.id,
            )

          }

        }

      }


      const FIN:
        Array<
          [
            string,
            string,
            'income' | 'expense',
            string,
          ]
        > = [

        [
          'subscriptions',
          'subscription',
          'income',
          'Abonnement',
        ],

        [
          'commissions',
          'commission',
          'income',
          'Commission',
        ],

        [
          'payments',
          'sale',
          'income',
          'Paiement',
        ],

        [
          'fees',
          'payment_fee',
          'expense',
          'Frais de paiement',
        ],

        [
          'refunds',
          'refund',
          'expense',
          'Remboursement',
        ],

        [
          'payouts',
          'merchant_payout',
          'expense',
          'Reversement marchand',
        ],
      ]


      for (
        const [
          key,
          category,
          type,
          label,
        ]
        of FIN
      ) {

        for (
          const financial
          of (
            data[key] ??
            []
          ) as any[]
        ) {

          const amount =
            Math.abs(
              Number(
                financial.amount ??
                0,
              ),
            )


          if (
            !financial.id ||
            !amount
          ) {
            continue
          }


          const row = {
            platform_id:
              `${category}:${financial.id}`,

            type,

            category,

            amount,

            currency:
              (
                financial.currency ??
                'EUR'
              ).toUpperCase(),

            description:
              financial.description ??
              `${label}${
                financial.plan
                  ? ` — ${financial.plan}`
                  : ''
              }`,

            reference:
              financial.stripe_id ??
              financial.payment_intent ??
              financial.order_number ??
              financial.reference ??
              null,

            transaction_date:
              String(
                financial.date ??
                financial.created_at ??
                now,
              ).slice(0, 10),

            shop_id:
              financial.boutique_id
                ? (
                    shopMap.get(
                      financial.boutique_id,
                    ) ?? null
                  )
                : null,

            source:
              'platform',

            platform_synced_at:
              now,
          }


          const {
            error,
          } = await admin
            .from('cashflows')
            .upsert(
              row,
              {
                onConflict:
                  'platform_id',
              },
            )


          if (error) {

            errors.push(
              `${label} ${
                financial.id
              }: ${
                error.message
              }`,
            )

          } else {

            count++

          }

        }

      }


      const financialCount =
        FIN.reduce(
          (
            total,
            [key],
          ) =>
            total +
            (
              data[key] ?? []
            ).length,
          0,
        )


      if (financialCount) {

        notify(
          'finance',
          'Flux financiers synchronisés',
          `${financialCount} opérations depuis B.I.B Platform`,
          '/pole/finance',
        )

      }


      // ------------------------------------------------------
      // 8. NOTIFICATIONS
      // ------------------------------------------------------

      if (
        notifications.length
      ) {

        const {
          error,
        } = await admin
          .from('notifications')
          .insert(
            notifications,
          )


        if (error) {

          errors.push(
            `notifications: ${
              error.message
            }`,
          )

        }

      }

    }


    // ========================================================
    // PUSH PRODUIT
    // ========================================================

    if (
      body.action ===
      'push_product'
    ) {

      const {
        data: product,
        error,
      } = await admin
        .from('products')
        .select('*')
        .eq(
          'id',
          body.product_id,
        )
        .single()


      if (
        error ||
        !product
      ) {

        throw new Error(
          'Produit introuvable',
        )

      }


      if (
        ![
          'validated',
          'approved',
          'active',
        ].includes(
          String(
            product.status,
          ),
        )
      ) {

        throw new Error(
          'Seuls les produits validés peuvent être publiés',
        )

      }


      const response =
        await callPlatform(
          'intranet-import',
          {
            type:
              'supplier_product',

            data: {
              intranet_id:
                product.id,

              platform_id:
                product.platform_id ??
                null,

              name:
                product.name,

              description:
                product.description ??
                null,

              category:
                product.category ??
                null,

              base_price:
                product.selling_price ??
                null,

              moq:
                product.moq ??
                null,

              max_margin_percent:
                product.margin ??
                null,

              image_url:
                product.image_url ??
                null,

              market:
                product.origin ??
                null,

              is_active:
                true,
            },
          },
        )


      await admin
        .from('products')
        .update({
          platform_id:
            response.id ??
            product.platform_id,

          platform_synced_at:
            now,

          platform_publish_status:
            'published',
        })
        .eq(
          'id',
          product.id,
        )


      count = 1
    }


    // ========================================================
    // PUSH STATUT BOUTIQUE
    // ========================================================

    if (
      body.action ===
      'push_shop_status'
    ) {

      const {
        data: shop,
      } = await admin
        .from('shops')
        .select(
          'id, platform_id, status',
        )
        .eq(
          'id',
          body.shop_id,
        )
        .single()


      if (
        !shop?.platform_id
      ) {

        throw new Error(
          'Boutique non liée à la plateforme',
        )

      }


      // Aucun statut test/trial ne peut désormais
      // être envoyé vers la plateforme.

      if (
        [
          'draft',
          'application',
          'review',
          'active',
          'inactive',
          'suspended',
          'closed',
        ].indexOf(
          shop.status,
        ) === -1
      ) {

        throw new Error(
          `Statut boutique invalide : ${shop.status}`,
        )

      }


      await callPlatform(
        'intranet-import',
        {
          type:
            'boutique_status',

          data: {
            platform_id:
              shop.platform_id,

            status:
              shop.status,
          },
        },
      )


      await admin
        .from('shops')
        .update({
          platform_synced_at:
            now,
        })
        .eq(
          'id',
          shop.id,
        )


      count = 1
    }


    // ========================================================
    // FIN SYNC
    // ========================================================

    await admin
      .from('platform_sync_runs')
      .update({
        status:
          errors.length
            ? 'partial'
            : 'success',

        items_count:
          count,

        errors,

        finished_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        run!.id,
      )


    if (errors.length) {

      await admin
        .from('anomalies')
        .insert({
          source:
            'platform',

          type:
            'Synchronisation partielle',

          severity:
            errors.length > 5
              ? 'high'
              : 'medium',

          title:
            `Synchronisation B.I.B Platform : ${errors.length} rejet(s)`,

          description:
            errors
              .slice(0, 20)
              .join('\n'),

          object_type:
            'platform_sync_run',

          object_id:
            run!.id,

          created_by:
            uid,
        })

    }


    return json({
      success: true,
      items: count,
      errors,
    })


  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : String(error)


    await admin
      .from('platform_sync_runs')
      .update({
        status:
          'error',

        items_count:
          count,

        errors:
          [
            ...errors,
            message,
          ],

        finished_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        run!.id,
      )


    await admin
      .from('anomalies')
      .insert({
        source:
          'platform',

        type:
          'Échec de synchronisation',

        severity:
          'high',

        title:
          `Échec ${body.action} B.I.B Platform`,

        description:
          message.slice(
            0,
            1000,
          ),

        object_type:
          'platform_sync_run',

        object_id:
          run!.id,

        created_by:
          uid,
      })


    return json(
      {
        error:
          message,
      },
      502,
    )
  }
})
