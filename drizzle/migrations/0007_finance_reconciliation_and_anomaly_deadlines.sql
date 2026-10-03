
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  kind text not null default 'invoice' check (kind in ('invoice','credit_note')),
  amount_ht numeric not null default 0,
  vat_amount numeric not null default 0,
  amount_ttc numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'issued' check (status in ('draft','issued','sent','paid','cancelled','error')),
  issued_at timestamptz not null default now(),
  platform_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_id text not null unique,
  payment_intent text,
  event_type text not null default 'charge' check (event_type in ('charge','refund','dispute','payout','fee')),
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  shop_id uuid references public.shops(id) on delete set null,
  amount numeric not null default 0,
  fee_amount numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'succeeded',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.merchant_payouts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'EUR',
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  stripe_payout_id text,
  paid_at timestamptz,
  platform_id text unique,
  created_at timestamptz not null default now()
);
create table public.reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete set null,
  order_amount numeric not null default 0,
  stripe_amount numeric,
  stripe_fee numeric,
  invoice_amount numeric,
  payout_amount numeric,
  expected_payout numeric,
  commission_amount numeric,
  gaps text[] not null default '{}',
  status text not null default 'matched' check (status in ('matched','gap','reviewing','resolved','ignored')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  anomaly_id uuid references public.anomalies(id) on delete set null,
  computed_at timestamptz not null default now()
);
create index on public.stripe_events(order_id);
create index on public.invoices(order_id);
create index on public.merchant_payouts(order_id);
create index on public.reconciliation_items(status);

grant select, insert, update, delete on public.invoices, public.stripe_events, public.merchant_payouts, public.reconciliation_items to authenticated;
grant all on public.invoices, public.stripe_events, public.merchant_payouts, public.reconciliation_items to service_role;

alter table public.invoices enable row level security;
alter table public.stripe_events enable row level security;
alter table public.merchant_payouts enable row level security;
alter table public.reconciliation_items enable row level security;

create or replace function public.can_access_finance(_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_leadership(_uid) or public.has_role(_uid,'admin') or public.has_any_pole(_uid, array['finance'])
$$;

do $$ declare t text; begin
  foreach t in array array['invoices','stripe_events','merchant_payouts','reconciliation_items'] loop
    execute format('create policy "Finance lit %1$s" on public.%1$s for select to authenticated using (public.can_access_finance(auth.uid()))', t);
    execute format('create policy "Finance ajoute %1$s" on public.%1$s for insert to authenticated with check (public.can_access_finance(auth.uid()))', t);
    execute format('create policy "Finance modifie %1$s" on public.%1$s for update to authenticated using (public.can_access_finance(auth.uid())) with check (public.can_access_finance(auth.uid()))', t);
    execute format('create policy "Direction supprime %1$s" on public.%1$s for delete to authenticated using (public.is_leadership(auth.uid()) or public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

create or replace function public.run_reconciliation() returns integer
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; g text[]; tol numeric := 0.01;
begin
  if auth.uid() is not null and not public.can_access_finance(auth.uid()) then
    raise exception 'Accès refusé';
  end if;
  for r in
    select o.id, o.shop_id, coalesce(o.total_amount,0) amt, o.status,
      coalesce(s.commission_rate,0) rate,
      (select sum(case when e.event_type='refund' then -e.amount else e.amount end) from stripe_events e where e.order_id=o.id and e.event_type in ('charge','refund') and e.status='succeeded') st,
      (select sum(e.fee_amount) from stripe_events e where e.order_id=o.id) fee,
      (select sum(case when i.kind='credit_note' then -i.amount_ttc else i.amount_ttc end) from invoices i where i.order_id=o.id and i.status<>'cancelled') inv,
      (select sum(p.amount) from merchant_payouts p where p.order_id=o.id and p.status in ('pending','paid')) pay,
      (select count(*) from stripe_events e where e.order_id=o.id and e.event_type='dispute') disputes
    from orders o left join shops s on s.id=o.shop_id
  loop
    g := '{}';
    if r.st is null then g := g || 'stripe_manquant'::text;
    elsif abs(r.st - r.amt) > tol then g := g || 'ecart_stripe'::text; end if;
    if r.inv is null then g := g || 'facture_manquante'::text;
    elsif abs(r.inv - r.amt) > tol then g := g || 'ecart_facture'::text; end if;
    if r.shop_id is null then g := g || 'boutique_manquante'::text; end if;
    if r.pay is not null and abs(r.pay - (r.amt - round(r.amt*r.rate/100,2) - coalesce(r.fee,0))) > tol then g := g || 'ecart_reversement'::text; end if;
    if r.pay is null and r.status in ('delivered','completed') then g := g || 'reversement_manquant'::text; end if;
    if r.disputes > 0 then g := g || 'litige'::text; end if;

    insert into reconciliation_items(order_id, shop_id, order_amount, stripe_amount, stripe_fee, invoice_amount, payout_amount,
      commission_amount, expected_payout, gaps, status, computed_at)
    values (r.id, r.shop_id, r.amt, r.st, r.fee, r.inv, r.pay, round(r.amt*r.rate/100,2),
      r.amt - round(r.amt*r.rate/100,2) - coalesce(r.fee,0), g, case when cardinality(g)=0 then 'matched' else 'gap' end, now())
    on conflict (order_id) do update set
      shop_id=excluded.shop_id, order_amount=excluded.order_amount, stripe_amount=excluded.stripe_amount,
      stripe_fee=excluded.stripe_fee, invoice_amount=excluded.invoice_amount, payout_amount=excluded.payout_amount,
      commission_amount=excluded.commission_amount, expected_payout=excluded.expected_payout, gaps=excluded.gaps,
      computed_at=now(),
      status = case
        when cardinality(excluded.gaps)=0 then 'matched'
        when reconciliation_items.status in ('reviewing','resolved','ignored') and reconciliation_items.gaps = excluded.gaps then reconciliation_items.status
        else 'gap' end;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.run_reconciliation() from public, anon;
grant execute on function public.run_reconciliation() to authenticated;

alter table public.anomalies
  add column if not exists due_at timestamptz,
  add column if not exists reminder_at timestamptz,
  add column if not exists last_reminded_at timestamptz,
  add column if not exists category text,
  add column if not exists checks jsonb not null default '[]'::jsonb,
  add column if not exists ai_suggestion jsonb,
  add column if not exists ai_decision text check (ai_decision in ('accepted','modified','rejected')),
  add column if not exists ai_validated_by uuid,
  add column if not exists ai_validated_at timestamptz;

create table public.anomaly_notifications (
  id uuid primary key default gen_random_uuid(),
  anomaly_id uuid not null references public.anomalies(id) on delete cascade,
  recipient_id uuid,
  kind text not null check (kind in ('assigned','reminder','overdue','due_changed')),
  message text,
  sent_at timestamptz not null default now()
);
create index on public.anomaly_notifications(anomaly_id);
grant select on public.anomaly_notifications to authenticated;
grant all on public.anomaly_notifications to service_role;
alter table public.anomaly_notifications enable row level security;
create policy "Lecture historique notifications anomalies" on public.anomaly_notifications
  for select to authenticated using (public.can_access_anomalies(auth.uid()));

create or replace function public.notify_anomaly(_a public.anomalies, _kind text, _msg text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if _a.owner_id is null then return; end if;
  insert into notifications(user_id, title, message, type, action_url, metadata)
  values (_a.owner_id,
    (case _kind when 'assigned' then 'Anomalie assignée' when 'overdue' then 'Anomalie en retard' when 'due_changed' then 'Échéance modifiée' else 'Rappel anomalie' end)
      || ' — ' || _a.reference,
    _msg, (case when _kind='overdue' then 'critical' else 'warning' end)::notification_type,
    '/pole/ops/anomalies', jsonb_build_object('anomaly_id', _a.id, 'kind', _kind));
  insert into anomaly_notifications(anomaly_id, recipient_id, kind, message) values (_a.id, _a.owner_id, _kind, _msg);
end $$;
revoke execute on function public.notify_anomaly(public.anomalies, text, text) from public, anon, authenticated;

create or replace function public.anomaly_assignment_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null and (tg_op='INSERT' or new.owner_id is distinct from old.owner_id) then
    perform public.notify_anomaly(new, 'assigned', new.title || coalesce(' — échéance ' || to_char(new.due_at at time zone 'Europe/Paris','DD/MM/YYYY HH24:MI'), ''));
  elsif tg_op='UPDATE' and new.due_at is distinct from old.due_at and new.owner_id is not null then
    perform public.notify_anomaly(new, 'due_changed', 'Nouvelle échéance : ' || coalesce(to_char(new.due_at at time zone 'Europe/Paris','DD/MM/YYYY HH24:MI'),'aucune'));
  end if;
  return new;
end $$;
create trigger trg_anomaly_assignment_notify after insert or update of owner_id, due_at on public.anomalies
  for each row execute function public.anomaly_assignment_notify();

create or replace function public.send_anomaly_reminders() returns integer
language plpgsql security definer set search_path = public as $$
declare a public.anomalies; n int := 0;
begin
  for a in select * from anomalies where owner_id is not null and status not in ('resolved','closed')
      and due_at is not null
      and (last_reminded_at is null or last_reminded_at < now() - interval '20 hours')
      and (due_at < now() or coalesce(reminder_at, due_at - interval '24 hours') <= now())
      limit 200
  loop
    perform public.notify_anomaly(a, case when a.due_at < now() then 'overdue' else 'reminder' end,
      a.title || ' — échéance ' || to_char(a.due_at at time zone 'Europe/Paris','DD/MM/YYYY HH24:MI'));
    update anomalies set last_reminded_at = now() where id = a.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.send_anomaly_reminders() from public, anon, authenticated;

select cron.schedule('anomaly-reminders', '0 * * * *', $$select public.send_anomaly_reminders()$$);
