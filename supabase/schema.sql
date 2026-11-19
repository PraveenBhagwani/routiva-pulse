-- ==============================================================================
-- Routiva Pulse: PostgreSQL Schema, RLS, RPCs & Seed Data
-- Database: Supabase PostgreSQL (Project Ref: oqttljgjwyzoqsxqwoap)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Table: public.pulse_rules
-- Stores studio configuration, owner WhatsApp chat ID, and rhythm multipliers
-- ------------------------------------------------------------------------------
create table if not exists public.pulse_rules (
    id uuid primary key default gen_random_uuid(),
    business_name text not null default 'IronCore Fitness Studio',
    owner_chat_id text not null default '919823011100',
    slipping_multiplier numeric not null default 1.75,
    gone_quiet_multiplier numeric not null default 3.0,
    watch_multiplier numeric not null default 1.25,
    snooze_days integer not null default 30,
    min_checkins_for_baseline integer not null default 4,
    currency_symbol text not null default '₹',
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. Table: public.pulse_tone
-- Stores head coach persona and Hinglish drafting rules
-- ------------------------------------------------------------------------------
create table if not exists public.pulse_tone (
    id uuid primary key default gen_random_uuid(),
    coach_name text not null default 'Coach',
    gym_vibe text not null default 'IronCore Strength & Functional Training',
    language_blend text not null default 'Urban Casual Hinglish',
    sample_template text not null default 'Hey {first_name}! Missed you in the gym this week. Aaj evening workout ke liye aa rahe ho na?',
    urgency_level text not null default 'Balanced',
    custom_signature text not null default 'Head Coach | IronCore Fitness',
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. Table: public.pulse_attendance_logs
-- Biometric turnstile check-in events
-- ------------------------------------------------------------------------------
create table if not exists public.pulse_attendance_logs (
    id uuid primary key default gen_random_uuid(),
    customer text not null,
    phone text not null,
    check_in_time timestamptz not null default now(),
    plan text default 'Annual Pro Membership',
    yearly_value_rs numeric default 18000,
    created_at timestamptz not null default now()
);

create index if not exists idx_pulse_attendance_phone on public.pulse_attendance_logs(phone);
create index if not exists idx_pulse_attendance_checkin on public.pulse_attendance_logs(check_in_time);

-- ------------------------------------------------------------------------------
-- 4. Table: public.pulse_watchlist
-- Main retention desk priority queue
-- ------------------------------------------------------------------------------
create table if not exists public.pulse_watchlist (
    id text primary key,
    customer text not null,
    member_name text not null,
    phone text not null,
    status text not null, -- 'Gone Quiet' | 'Slipping' | 'Watch' | 'Seasonal' | 'Won Back' | 'Healthy'
    plan text default 'Annual Strength & Conditioning',
    yearly_value_rs numeric default 18000,
    at_risk_rs numeric default 0,
    days_silent integer default 0,
    usual_gap_days numeric default 2.5,
    steadiness_mad numeric default 1.0,
    lateness_ratio numeric default 0.0,
    last_check_in text,
    likely_reason text,
    suggested_action text,
    draft_message text,
    coach_assigned text default 'Coach',
    snoozed_until timestamptz,
    last_decision text,
    decision text,
    seasonal_pattern_detected boolean default false,
    updated_at timestamptz not null default now()
);

create index if not exists idx_pulse_watchlist_status on public.pulse_watchlist(status);
create index if not exists idx_pulse_watchlist_phone on public.pulse_watchlist(phone);

-- ------------------------------------------------------------------------------
-- 5. Table: public.pulse_decisions
-- Audit log of coach approvals, snoozes, and seasonal markings
-- ------------------------------------------------------------------------------
create table if not exists public.pulse_decisions (
    id text primary key default ('dec_' || extract(epoch from now())::bigint || '_' || floor(random()*1000)::text),
    customer text,
    member_id text,
    member_name text,
    phone text,
    decision text not null, -- 'Approved' | 'Skipped' | 'Seasonal'
    draft_sent text,
    date timestamptz default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_pulse_decisions_created on public.pulse_decisions(created_at desc);

-- ------------------------------------------------------------------------------
-- 6. Table: public.pulse_run_log
-- Historical trend snapshots for churn analytics
-- ------------------------------------------------------------------------------
create table if not exists public.pulse_run_log (
    id text primary key default ('log_' || extract(epoch from now())::bigint),
    run_date text not null,
    total_members_scanned integer default 0,
    gone_quiet_count integer default 0,
    slipping_count integer default 0,
    on_watch_count integer default 0,
    at_risk_revenue_rs numeric default 0,
    won_back_revenue_rs numeric default 0,
    created_at timestamptz not null default now()
);

create index if not exists idx_pulse_run_log_date on public.pulse_run_log(run_date);

-- ==============================================================================
-- Row Level Security (RLS) & Permissions
-- ==============================================================================

alter table public.pulse_rules enable row level security;
alter table public.pulse_tone enable row level security;
alter table public.pulse_attendance_logs enable row level security;
alter table public.pulse_watchlist enable row level security;
alter table public.pulse_decisions enable row level security;
alter table public.pulse_run_log enable row level security;

-- Permissive policies for retention desk operations
create policy "Allow all read on pulse_rules" on public.pulse_rules for select using (true);
create policy "Allow all write on pulse_rules" on public.pulse_rules for all using (true);

create policy "Allow all read on pulse_tone" on public.pulse_tone for select using (true);
create policy "Allow all write on pulse_tone" on public.pulse_tone for all using (true);

create policy "Allow all read on pulse_attendance_logs" on public.pulse_attendance_logs for select using (true);
create policy "Allow all write on pulse_attendance_logs" on public.pulse_attendance_logs for all using (true);

create policy "Allow all read on pulse_watchlist" on public.pulse_watchlist for select using (true);
create policy "Allow all write on pulse_watchlist" on public.pulse_watchlist for all using (true);

create policy "Allow all read on pulse_decisions" on public.pulse_decisions for select using (true);
create policy "Allow all write on pulse_decisions" on public.pulse_decisions for all using (true);

create policy "Allow all read on pulse_run_log" on public.pulse_run_log for select using (true);
create policy "Allow all write on pulse_run_log" on public.pulse_run_log for all using (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- ==============================================================================
-- PL/pgSQL RPC Functions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RPC 1: get_pulse_desk_data()
-- Aggregates all desk state in a single non-blocking JSON roundtrip
-- ------------------------------------------------------------------------------
create or replace function public.get_pulse_desk_data()
returns jsonb
language plpgsql
security definer
as $$
declare
    v_watchlist jsonb;
    v_run_logs jsonb;
    v_decisions jsonb;
    v_rules jsonb;
    v_tone jsonb;
begin
    -- 1. Watchlist
    select coalesce(jsonb_agg(to_jsonb(w)), '[]'::jsonb)
    into v_watchlist
    from (
        select * from public.pulse_watchlist
        order by lateness_ratio desc
    ) w;

    -- 2. Run Logs
    select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
    into v_run_logs
    from (
        select * from public.pulse_run_log
        order by run_date asc
        limit 12
    ) r;

    -- 3. Decisions
    select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
    into v_decisions
    from (
        select * from public.pulse_decisions
        order by created_at desc
        limit 20
    ) d;

    -- 4. Rules
    select to_jsonb(r)
    into v_rules
    from (
        select * from public.pulse_rules
        limit 1
    ) r;

    -- 5. Tone
    select to_jsonb(t)
    into v_tone
    from (
        select * from public.pulse_tone
        limit 1
    ) t;

    return jsonb_build_object(
        'watchlist', v_watchlist,
        'run_logs', v_run_logs,
        'decisions', v_decisions,
        'rules', coalesce(v_rules, '{}'::jsonb),
        'tone', coalesce(v_tone, '{}'::jsonb)
    );
end;
$$;

-- ------------------------------------------------------------------------------
-- RPC 2: save_pulse_run_results(payload jsonb)
-- Batch upserts recalculated retention desk metrics and run logs
-- ------------------------------------------------------------------------------
create or replace function public.save_pulse_run_results(payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_item jsonb;
    v_log jsonb;
begin
    -- 1. Upsert watchlist members if provided
    if payload ? 'watchlist' and jsonb_typeof(payload->'watchlist') = 'array' then
        for v_item in select * from jsonb_array_elements(payload->'watchlist')
        loop
            insert into public.pulse_watchlist (
                id,
                customer,
                member_name,
                phone,
                status,
                plan,
                yearly_value_rs,
                at_risk_rs,
                days_silent,
                usual_gap_days,
                steadiness_mad,
                lateness_ratio,
                last_check_in,
                likely_reason,
                suggested_action,
                draft_message,
                coach_assigned,
                snoozed_until,
                last_decision,
                decision,
                seasonal_pattern_detected,
                updated_at
            ) values (
                coalesce(v_item->>'id', 'mem_' || (v_item->>'phone')),
                coalesce(v_item->>'customer', v_item->>'member_name', 'Member'),
                coalesce(v_item->>'member_name', v_item->>'customer', 'Member'),
                coalesce(v_item->>'phone', ''),
                coalesce(v_item->>'status', 'Watch'),
                coalesce(v_item->>'plan', 'Annual Pro Membership'),
                coalesce((v_item->>'yearly_value_rs')::numeric, 18000),
                coalesce((v_item->>'at_risk_rs')::numeric, 0),
                coalesce((v_item->>'days_silent')::integer, 0),
                coalesce((v_item->>'usual_gap_days')::numeric, 2.5),
                coalesce((v_item->>'steadiness_mad')::numeric, 1.0),
                coalesce((v_item->>'lateness_ratio')::numeric, 0.0),
                v_item->>'last_check_in',
                v_item->>'likely_reason',
                v_item->>'suggested_action',
                v_item->>'draft_message',
                coalesce(v_item->>'coach_assigned', 'Coach'),
                case when v_item->>'snoozed_until' is not null then (v_item->>'snoozed_until')::timestamptz else null end,
                v_item->>'last_decision',
                coalesce(v_item->>'decision', v_item->>'last_decision'),
                coalesce((v_item->>'seasonal_pattern_detected')::boolean, false),
                now()
            )
            on conflict (id) do update set
                customer = excluded.customer,
                member_name = excluded.member_name,
                phone = excluded.phone,
                status = excluded.status,
                plan = excluded.plan,
                yearly_value_rs = excluded.yearly_value_rs,
                at_risk_rs = excluded.at_risk_rs,
                days_silent = excluded.days_silent,
                usual_gap_days = excluded.usual_gap_days,
                steadiness_mad = excluded.steadiness_mad,
                lateness_ratio = excluded.lateness_ratio,
                last_check_in = excluded.last_check_in,
                likely_reason = excluded.likely_reason,
                suggested_action = excluded.suggested_action,
                draft_message = excluded.draft_message,
                coach_assigned = excluded.coach_assigned,
                snoozed_until = excluded.snoozed_until,
                last_decision = excluded.last_decision,
                decision = excluded.decision,
                seasonal_pattern_detected = excluded.seasonal_pattern_detected,
                updated_at = now();
        end loop;
    end if;

    -- 2. Insert run log entry if provided
    if payload ? 'run_log' and jsonb_typeof(payload->'run_log') = 'object' then
        v_log := payload->'run_log';
        insert into public.pulse_run_log (
            id,
            run_date,
            total_members_scanned,
            gone_quiet_count,
            slipping_count,
            on_watch_count,
            at_risk_revenue_rs,
            won_back_revenue_rs,
            created_at
        ) values (
            coalesce(v_log->>'id', 'log_' || extract(epoch from now())::bigint),
            coalesce(v_log->>'run_date', to_char(now(), 'YYYY-MM-DD')),
            coalesce((v_log->>'total_members_scanned')::integer, 0),
            coalesce((v_log->>'gone_quiet_count')::integer, 0),
            coalesce((v_log->>'slipping_count')::integer, 0),
            coalesce((v_log->>'on_watch_count')::integer, 0),
            coalesce((v_log->>'at_risk_revenue_rs')::numeric, 0),
            coalesce((v_log->>'won_back_revenue_rs')::numeric, 0),
            now()
        );
    end if;

    return jsonb_build_object('success', true, 'timestamp', now());
end;
$$;

-- ==============================================================================
-- Sample Seed Data: IronCore Fitness Studio
-- ==============================================================================

-- 1. Rules
insert into public.pulse_rules (
    business_name,
    owner_chat_id,
    slipping_multiplier,
    gone_quiet_multiplier,
    watch_multiplier,
    snooze_days,
    min_checkins_for_baseline,
    currency_symbol
) values (
    'IronCore Fitness Studio',
    '919823011100',
    1.75,
    3.0,
    1.25,
    30,
    4,
    '₹'
) on conflict do nothing;

-- 2. Tone
insert into public.pulse_tone (
    coach_name,
    gym_vibe,
    language_blend,
    sample_template,
    urgency_level,
    custom_signature
) values (
    'Coach',
    'IronCore Strength & Functional Training',
    'Urban Casual Hinglish',
    'Hey {first_name}! Missed you in the gym this week. Aaj evening workout ke liye aa rahe ho na?',
    'Balanced',
    'Head Coach | IronCore Fitness'
) on conflict do nothing;

-- 3. Run Logs
insert into public.pulse_run_log (id, run_date, total_members_scanned, gone_quiet_count, slipping_count, on_watch_count, at_risk_revenue_rs, won_back_revenue_rs)
values
    ('log_101', '2026-10-23', 180, 14, 22, 15, 420000, 60000),
    ('log_102', '2026-10-30', 185, 12, 19, 14, 375000, 110000),
    ('log_103', '2026-11-06', 188, 10, 16, 18, 310000, 175000),
    ('log_104', '2026-11-13', 195, 7, 11, 10, 215000, 310000)
on conflict (id) do nothing;

-- 4. Watchlist Cohort (IronCore Fitness Studio members)
insert into public.pulse_watchlist (
    id, customer, member_name, phone, status, plan, yearly_value_rs, at_risk_rs,
    days_silent, usual_gap_days, steadiness_mad, lateness_ratio, last_check_in,
    likely_reason, suggested_action, draft_message, coach_assigned, seasonal_pattern_detected
) values
(
    'mem_9823011101',
    'Vikram Patil',
    'Vikram Patil',
    '9823011101',
    'Gone Quiet',
    'Annual Elite Strength',
    24000,
    24000,
    24,
    2.2,
    0.8,
    8.7,
    '2026-10-26',
    'High churn hazard: Habit break >3 weeks with lost gym momentum',
    'Call & Personal Re-Engagement Offer',
    'Hey Vikram! Coach here from IronCore Gym. Kafi dino (24 din) se workout miss ho raha hai bhai. Sab theek? Aaj ek light recovery session karein? Let me know! 💪',
    'Coach',
    false
),
(
    'mem_9823011102',
    'Sneha Kulkarni',
    'Sneha Kulkarni',
    '9823011102',
    'Healthy',
    'Annual Pro Functional',
    22000,
    0,
    1,
    2.0,
    0.3,
    0.4,
    '2026-11-18',
    'Consistent regular attendance',
    'Maintain Regular Routine',
    'Hey Sneha! Great consistency on your workouts recently! Keep crushing your personal records! 🔥',
    'Coach',
    false
),
(
    'mem_9823011103',
    'Priya Nair',
    'Priya Nair',
    '9823011103',
    'Slipping',
    '6-Month Functional Fitness',
    18000,
    12600,
    12,
    2.0,
    0.5,
    4.8,
    '2026-11-07',
    'Sudden routine disruption: Previously had an ultra-disciplined rhythm',
    'Send WhatsApp Check-In & Slot Booking',
    'Hey Priya! Coach from IronCore Gym. Missed you at the gym! 12 din se flow break hua hai. Aise momentum lose mat karo. Aaj evening me milte hain for a quick set? 🏋️',
    'Coach',
    false
),
(
    'mem_9823011104',
    'Rohan Deshmukh',
    'Rohan Deshmukh',
    '9823011104',
    'Slipping',
    'Annual All-Access + Steam',
    22000,
    15400,
    9,
    3.0,
    1.2,
    2.1,
    '2026-11-10',
    'Post-workout fatigue, travel pause, or work deadline friction',
    'Send WhatsApp Check-In & Slot Booking',
    'Hey Rohan! Coach here from IronCore. 9 din ho gaye bro gym dekhe hue! Busy week chal raha tha kya? Weekend pe leg day cover karte hain!',
    'Coach',
    false
),
(
    'mem_9823011105',
    'Karan Malhotra',
    'Karan Malhotra',
    '9823011105',
    'Watch',
    'Quarterly Pilates & Strength',
    16000,
    5600,
    5,
    2.5,
    0.9,
    1.4,
    '2026-11-14',
    'Minor schedule deviation from regular training cycle',
    'Monitor Attendance Next 48h',
    'Hi Karan! Coach here. Noticed last check-in was 5 days ago vs usual 2.5d rhythm. Aaj aa rahe ho na session ke liye? Let me know if you need any form checks!',
    'Coach',
    false
),
(
    'mem_9823011106',
    'Neha Deshpande',
    'Neha Deshpande',
    '9823011106',
    'Seasonal',
    'Annual Premium',
    28000,
    0,
    18,
    2.8,
    1.1,
    4.2,
    '2026-11-01',
    'Seasonal drop matching last year’s cycle (Festive / Exams / Family travel)',
    'Keep in Seasonal Pause / Warm Greeting',
    'Hi Neha! Hope all is well. Understand exam/festival season chal raha hai. Jab bhi time mile 20 min stretch/cardio ke liye drop in kar lena. Stay active! - Coach',
    'Coach',
    true
),
(
    'mem_9823011107',
    'Sameer Gokhale',
    'Sameer Gokhale',
    '9823011107',
    'Won Back',
    'Annual Strength Pass',
    20000,
    0,
    2,
    2.0,
    0.4,
    0.7,
    '2026-11-17',
    'Re-engaged after coach intervention',
    'Maintain Regular Routine',
    'Hey Sameer! Great consistency on your workouts recently! Keep crushing your personal records! 🔥',
    'Coach',
    false
),
(
    'mem_9823011108',
    'Siddharth Shinde',
    'Siddharth Shinde',
    '9823011108',
    'Watch',
    '6-Month Functional Fitness',
    18000,
    6300,
    6,
    2.4,
    0.8,
    1.6,
    '2026-11-13',
    'Minor schedule deviation from regular training cycle',
    'Monitor Attendance Next 48h',
    'Hey Siddharth! Coach here. 6 din se training miss hui hai. Aaj evening slot me resume karein?',
    'Coach',
    false
),
(
    'mem_9823011109',
    'Aditya Joshi',
    'Aditya Joshi',
    '9823011109',
    'Healthy',
    'Annual Pro Functional',
    22000,
    0,
    1,
    2.1,
    0.4,
    0.4,
    '2026-11-18',
    'Consistent regular attendance',
    'Maintain Regular Routine',
    'Hey Aditya! Strong session yesterday, keep the momentum alive! 🔥',
    'Coach',
    false
)
on conflict (id) do nothing;

-- 5. Decisions Feed Seed
insert into public.pulse_decisions (id, customer, member_id, member_name, phone, decision, draft_sent, date)
values
    ('dec_201', 'Sameer Gokhale', 'mem_9823011107', 'Sameer Gokhale', '9823011107', 'Approved', 'Hey Sameer! Missed you this week bro. Aaj evening me set lagate hain?', now() - interval '2 hours'),
    ('dec_202', 'Neha Deshpande', 'mem_9823011106', 'Neha Deshpande', '9823011106', 'Seasonal', 'Seasonal Pause recorded for Nov exams/festivals.', now() - interval '5 hours'),
    ('dec_203', 'Karan Malhotra', 'mem_9823011105', 'Karan Malhotra', '9823011105', 'Skipped', '30-day snooze applied (Member on personal medical recovery)', now() - interval '1 day')
on conflict (id) do nothing;
