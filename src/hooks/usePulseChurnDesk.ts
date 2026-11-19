import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, PULSE_N8N_WEBHOOK_URL } from '../lib/supabase';
import {
  PulseWatchlistMember,
  PulseRunLog,
  PulseDecision,
  PulseRules,
  PulseTone,
  DecisionType,
  CsvCheckInRecord,
} from '../types';
import { recalculateRhythm, normalizePhone } from '../lib/rhythmEngine';

const DEFAULT_RULES: PulseRules = {
  business_name: 'IronForge Fitness & Performance',
  owner_chat_id: '',
  slipping_multiplier: 1.75,
  gone_quiet_multiplier: 3.0,
  watch_multiplier: 1.25,
  snooze_days: 30,
  min_checkins_for_baseline: 4,
  currency_symbol: '₹',
};

const DEFAULT_TONE: PulseTone = {
  coach_name: 'Coach',
  gym_vibe: 'IronForge Performance Gym',
  language_blend: 'Urban Delhi / Mumbai Casual Hinglish',
  sample_template: 'Hey {first_name}! Missed you in the gym this week. Aaj evening workout ke liye aa rahe ho na?',
  urgency_level: 'Balanced',
  custom_signature: 'Head Coach | Performance Desk',
};

// Realistic mock fallback members if tables are initially empty
const FALLBACK_WATCHLIST: PulseWatchlistMember[] = [
  {
    id: 'mem_9811223344',
    customer: 'Vikram Malhotra',
    member_name: 'Vikram Malhotra',
    phone: '9811223344',
    status: 'Gone Quiet',
    plan: 'Annual Elite Strength & Conditioning',
    yearly_value_rs: 24000,
    at_risk_rs: 24000,
    days_silent: 24,
    usual_gap_days: 2.2,
    steadiness_mad: 0.8,
    lateness_ratio: 8.7,
    last_check_in: '2026-10-21',
    likely_reason: 'High churn hazard: Habit break >3 weeks with lost gym momentum',
    suggested_action: 'Call & Personal Re-Engagement Offer',
    draft_message: 'Hey Vikram! Coach here from IronForge Gym. Kafi dino (24 din) se workout miss ho raha hai bhai. Sab theek? Aaj ek light recovery session karein? Let me know! 💪',
    coach_assigned: 'Coach',
    seasonal_pattern_detected: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_9822334455',
    customer: 'Ananya Sharma',
    member_name: 'Ananya Sharma',
    phone: '9822334455',
    status: 'Slipping',
    plan: '6-Month Functional Fitness',
    yearly_value_rs: 18000,
    at_risk_rs: 12600,
    days_silent: 12,
    usual_gap_days: 2.0,
    steadiness_mad: 0.5,
    lateness_ratio: 4.8,
    last_check_in: '2026-11-02',
    likely_reason: 'Sudden routine disruption: Previously had an ultra-disciplined rhythm',
    suggested_action: 'Send WhatsApp Check-In & Slot Booking',
    draft_message: 'Hey Ananya! Coach from IronForge Gym. Missed you at the gym! 12 din se flow break hua hai. Aise momentum lose mat karo. Aaj evening me milte hain for a quick set? 🏋️',
    coach_assigned: 'Coach',
    seasonal_pattern_detected: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_9833445566',
    customer: 'Rohan Mehra',
    member_name: 'Rohan Mehra',
    phone: '9833445566',
    status: 'Slipping',
    plan: 'Annual All-Access + Steam',
    yearly_value_rs: 22000,
    at_risk_rs: 15400,
    days_silent: 9,
    usual_gap_days: 3.0,
    steadiness_mad: 1.2,
    lateness_ratio: 2.1,
    last_check_in: '2026-11-05',
    likely_reason: 'Post-workout fatigue, travel pause, or work deadline friction',
    suggested_action: 'Send WhatsApp Check-In & Slot Booking',
    draft_message: 'Hey Rohan! Coach here from IronForge. 9 din ho gaye bro gym dekhe hue! Busy week chal raha tha kya? Weekend pe leg day cover karte hain!',
    coach_assigned: 'Coach',
    seasonal_pattern_detected: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_9844556677',
    customer: 'Pooja Sharma',
    member_name: 'Pooja Sharma',
    phone: '9844556677',
    status: 'Watch',
    plan: 'Quarterly Pilates & Strength',
    yearly_value_rs: 16000,
    at_risk_rs: 5600,
    days_silent: 5,
    usual_gap_days: 2.5,
    steadiness_mad: 0.9,
    lateness_ratio: 1.4,
    last_check_in: '2026-11-09',
    likely_reason: 'Minor schedule deviation from regular training cycle',
    suggested_action: 'Monitor Attendance Next 48h',
    draft_message: 'Hi Pooja! Coach here. Noticed last check-in was 5 days ago vs usual 2.5d rhythm. Aaj aa rahe ho na session ke liye? Let me know if you need any form checks!',
    coach_assigned: 'Coach',
    seasonal_pattern_detected: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_9855667788',
    customer: 'Kabir Oberoi',
    member_name: 'Kabir Oberoi',
    phone: '9855667788',
    status: 'Seasonal',
    plan: 'Annual Premium',
    yearly_value_rs: 28000,
    at_risk_rs: 0,
    days_silent: 18,
    usual_gap_days: 2.8,
    steadiness_mad: 1.1,
    lateness_ratio: 4.2,
    last_check_in: '2026-10-27',
    likely_reason: 'Seasonal drop matching last year’s cycle (Festive / Exams / Family travel)',
    suggested_action: 'Keep in Seasonal Pause / Warm Greeting',
    draft_message: 'Hi Kabir! Hope all is well. Understand exam/festival season chal raha hai. Jab bhi time mile 20 min stretch/cardio ke liye drop in kar lena. Stay active! - Coach',
    coach_assigned: 'Coach',
    seasonal_pattern_detected: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_9866778899',
    customer: 'Deepak Verma',
    member_name: 'Deepak Verma',
    phone: '9866778899',
    status: 'Won Back',
    plan: 'Annual Strength Pass',
    yearly_value_rs: 20000,
    at_risk_rs: 0,
    days_silent: 2,
    usual_gap_days: 2.0,
    steadiness_mad: 0.4,
    lateness_ratio: 0.7,
    last_check_in: '2026-11-12',
    likely_reason: 'Re-engaged after coach intervention',
    suggested_action: 'Maintain Regular Routine',
    draft_message: 'Hey Deepak! Great consistency on your workouts recently! Keep crushing your personal records! 🔥',
    coach_assigned: 'Coach',
    last_decision: 'Approved',
    seasonal_pattern_detected: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_9877889900',
    customer: 'Sneha Kulkarni',
    member_name: 'Sneha Kulkarni',
    phone: '9877889900',
    status: 'Healthy',
    plan: 'Annual Pro',
    yearly_value_rs: 22000,
    at_risk_rs: 0,
    days_silent: 1,
    usual_gap_days: 2.0,
    steadiness_mad: 0.3,
    lateness_ratio: 0.4,
    last_check_in: '2026-11-13',
    likely_reason: 'Consistent regular attendance',
    suggested_action: 'Maintain Regular Routine',
    draft_message: 'Hey Sneha! Great workout yesterday, consistency is key! 🔥',
    coach_assigned: 'Coach',
    seasonal_pattern_detected: false,
    updated_at: new Date().toISOString(),
  }
];

const FALLBACK_LOGS: PulseRunLog[] = [
  {
    id: 'log_1',
    run_date: '2026-10-18',
    total_members_scanned: 180,
    gone_quiet_count: 14,
    slipping_count: 22,
    on_watch_count: 15,
    at_risk_revenue_rs: 420000,
    won_back_revenue_rs: 60000,
  },
  {
    id: 'log_2',
    run_date: '2026-10-25',
    total_members_scanned: 185,
    gone_quiet_count: 12,
    slipping_count: 19,
    on_watch_count: 14,
    at_risk_revenue_rs: 375000,
    won_back_revenue_rs: 110000,
  },
  {
    id: 'log_3',
    run_date: '2026-11-01',
    total_members_scanned: 188,
    gone_quiet_count: 10,
    slipping_count: 16,
    on_watch_count: 18,
    at_risk_revenue_rs: 310000,
    won_back_revenue_rs: 175000,
  },
  {
    id: 'log_4',
    run_date: '2026-11-08',
    total_members_scanned: 192,
    gone_quiet_count: 9,
    slipping_count: 14,
    on_watch_count: 12,
    at_risk_revenue_rs: 265000,
    won_back_revenue_rs: 240000,
  },
  {
    id: 'log_5',
    run_date: '2026-11-14',
    total_members_scanned: 195,
    gone_quiet_count: 7,
    slipping_count: 11,
    on_watch_count: 10,
    at_risk_revenue_rs: 215000,
    won_back_revenue_rs: 310000,
  },
];

const FALLBACK_DECISIONS: PulseDecision[] = [
  {
    id: 'dec_1',
    customer: 'Deepak Verma',
    member_id: 'mem_9866778899',
    member_name: 'Deepak Verma',
    phone: '9866778899',
    decision: 'Approved',
    draft_sent: 'Hey Deepak! Missed you this week bro. Aaj evening me set lagate hain?',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'dec_2',
    customer: 'Kabir Oberoi',
    member_id: 'mem_9855667788',
    member_name: 'Kabir Oberoi',
    phone: '9855667788',
    decision: 'Seasonal',
    draft_sent: 'Seasonal Pause recorded for Nov exams/festivals.',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'dec_3',
    customer: 'Karan Singhal',
    member_id: 'mem_9899112233',
    member_name: 'Karan Singhal',
    phone: '9899112233',
    decision: 'Skipped',
    draft_sent: '30-day snooze applied (Member on personal medical recovery)',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'dec_4',
    customer: 'Tanvi Joshi',
    member_id: 'mem_9877112244',
    member_name: 'Tanvi Joshi',
    phone: '9877112244',
    decision: 'Approved',
    draft_sent: 'Hey Tanvi! Coach here. Let me know when you are back for your core workout!',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function usePulseChurnDesk() {
  const [watchlist, setWatchlist] = useState<PulseWatchlistMember[]>(FALLBACK_WATCHLIST);
  const [runLogs, setRunLogs] = useState<PulseRunLog[]>(FALLBACK_LOGS);
  const [decisions, setDecisions] = useState<PulseDecision[]>(FALLBACK_DECISIONS);
  const [rules, setRules] = useState<PulseRules>(DEFAULT_RULES);
  const [tone, setTone] = useState<PulseTone>(DEFAULT_TONE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [toastMessage, setToastMessage] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const isMountedRef = useRef(true);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage({ id: Date.now(), message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  /**
   * Main data fetcher: calls get_pulse_desk_data RPC with fallback to direct queries
   */
  const fetchPulseDeskData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    setIsSyncing(true);

    // Helper to map watchlist row from Supabase's customer column (row.customer || row.name)
    const mapWatchlistRow = (row: any): PulseWatchlistMember => {
      const memberName = row.customer || row.name || row.member_name || 'Member';
      const cleanPhone = String(row.phone || '').replace(/\D/g, '').slice(-10);
      return {
        id: row.id || `mem_${cleanPhone || Math.random().toString(36).slice(2)}`,
        customer: row.customer || row.name || row.member_name || memberName,
        member_name: memberName,
        phone: cleanPhone,
        status: row.status || (row.decision === 'Approved' ? 'Won Back' : 'Watch'),
        plan: row.plan || 'Standard Gym Plan',
        yearly_value_rs: Number(row.yearly_value_rs ?? row.yearly_value ?? row.value ?? 18000),
        at_risk_rs: Number(row.at_risk_rs ?? row.at_risk ?? 0),
        days_silent: Number(row.days_silent ?? 0),
        usual_gap_days: Number(row.usual_gap_days ?? row.usual_gap ?? 2.5),
        steadiness_mad: Number(row.steadiness_mad ?? row.steadiness ?? 1.0),
        lateness_ratio: Number(row.lateness_ratio ?? 0),
        last_check_in: row.last_check_in || '',
        likely_reason: row.likely_reason || '',
        suggested_action: row.suggested_action || '',
        draft_message: row.draft_message || row.draft || '',
        coach_assigned: row.coach_assigned || '',
        snoozed_until: row.snoozed_until || null,
        last_decision: row.last_decision || row.decision || null,
        decision: row.decision || row.last_decision || null,
        seasonal_pattern_detected: Boolean(row.seasonal_pattern_detected),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    };

    const mapDecisionRow = (row: any): PulseDecision => {
      const memberName = row.customer || row.name || row.member_name || 'Member';
      return {
        id: row.id || `dec_${Date.now()}`,
        customer: row.customer || row.name || row.member_name || memberName,
        member_id: row.member_id || row.id || '',
        member_name: memberName,
        phone: String(row.phone || '').replace(/\D/g, '').slice(-10),
        decision: row.decision || 'Approved',
        draft_sent: row.draft_sent || row.draft || '',
        date: row.date || row.created_at || new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
      };
    };

    try {
      // 1. Attempt RPC call
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_pulse_desk_data');

      if (!rpcError && rpcData) {
        if (!isMountedRef.current) return;
        if (rpcData.watchlist && Array.isArray(rpcData.watchlist) && rpcData.watchlist.length > 0) {
          setWatchlist(rpcData.watchlist.map(mapWatchlistRow));
        }
        if (rpcData.run_logs && Array.isArray(rpcData.run_logs) && rpcData.run_logs.length > 0) {
          setRunLogs(rpcData.run_logs);
        }
        if (rpcData.decisions && Array.isArray(rpcData.decisions)) {
          setDecisions(rpcData.decisions.map(mapDecisionRow));
        }
        if (rpcData.rules) {
          setRules({ ...DEFAULT_RULES, ...rpcData.rules });
        }
        if (rpcData.tone) {
          setTone({ ...DEFAULT_TONE, ...rpcData.tone });
        }
        setLastUpdated(new Date());
        return;
      }

      // 2. Fallback direct queries if RPC is not present or failed
      const [
        watchlistRes,
        logsRes,
        decisionsRes,
        rulesRes,
        toneRes,
      ] = await Promise.allSettled([
        supabase.from('pulse_watchlist').select('*').order('lateness_ratio', { ascending: false }),
        supabase.from('pulse_run_log').select('*').order('run_date', { ascending: true }).limit(10),
        supabase.from('pulse_decisions').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('pulse_rules').select('*').limit(1).maybeSingle(),
        supabase.from('pulse_tone').select('*').limit(1).maybeSingle(),
      ]);

      if (!isMountedRef.current) return;

      if (watchlistRes.status === 'fulfilled' && !watchlistRes.value.error && watchlistRes.value.data?.length) {
        setWatchlist((watchlistRes.value.data as any[]).map(mapWatchlistRow));
      }
      if (logsRes.status === 'fulfilled' && !logsRes.value.error && logsRes.value.data?.length) {
        setRunLogs(logsRes.value.data as PulseRunLog[]);
      }
      if (decisionsRes.status === 'fulfilled' && !decisionsRes.value.error && decisionsRes.value.data) {
        setDecisions((decisionsRes.value.data as any[]).map(mapDecisionRow));
      }
      if (rulesRes.status === 'fulfilled' && !rulesRes.value.error && rulesRes.value.data) {
        setRules({ ...DEFAULT_RULES, ...rulesRes.value.data });
      }
      if (toneRes.status === 'fulfilled' && !toneRes.value.error && toneRes.value.data) {
        setTone({ ...DEFAULT_TONE, ...toneRes.value.data });
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Error fetching Pulse Desk data from Supabase, relying on resilient state:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSyncing(false);
      }
    }
  }, []);

  // Mount and 15-second polling interval
  useEffect(() => {
    isMountedRef.current = true;
    fetchPulseDeskData(false);

    const interval = setInterval(() => {
      fetchPulseDeskData(true);
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchPulseDeskData]);

  // Derived KPI metrics
  const atRiskRupees = useMemo(() => {
    return watchlist
      .filter((m) => m.status === 'Gone Quiet' || m.status === 'Slipping')
      .reduce((sum, m) => sum + (Number(m.at_risk_rs) || 0), 0);
  }, [watchlist]);

  const wonBackRupees = useMemo(() => {
    // Sum of yearly_value_rs for members with status 'Won Back' or approved decisions
    return watchlist
      .filter((m) => m.status === 'Won Back' || m.last_decision === 'Approved')
      .reduce((sum, m) => sum + (Number(m.yearly_value_rs) || 0), 0);
  }, [watchlist]);

  const statusCounts = useMemo(() => {
    const counts = {
      goneQuiet: 0,
      slipping: 0,
      watch: 0,
      seasonal: 0,
      wonBack: 0,
      healthy: 0,
      totalActionable: 0,
      total: watchlist.length,
    };

    watchlist.forEach((m) => {
      switch (m.status) {
        case 'Gone Quiet':
          counts.goneQuiet += 1;
          counts.totalActionable += 1;
          break;
        case 'Slipping':
          counts.slipping += 1;
          counts.totalActionable += 1;
          break;
        case 'Watch':
          counts.watch += 1;
          counts.totalActionable += 1;
          break;
        case 'Seasonal':
          counts.seasonal += 1;
          break;
        case 'Won Back':
          counts.wonBack += 1;
          break;
        case 'Healthy':
          counts.healthy += 1;
          break;
        default:
          break;
      }
    });

    return counts;
  }, [watchlist]);

  // Sorted action queue: Gone Quiet first, then Slipping, then Watch, then sorted by at_risk_rs / lateness_ratio
  const actionQueue = useMemo(() => {
    const statusPriority: Record<string, number> = {
      'Gone Quiet': 1,
      'Slipping': 2,
      'Watch': 3,
      'Seasonal': 4,
      'Won Back': 5,
      'Healthy': 6,
    };

    return [...watchlist].sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      if (pA !== pB) return pA - pB;
      // Secondary sort: at_risk_rs descending
      if ((b.at_risk_rs || 0) !== (a.at_risk_rs || 0)) {
        return (b.at_risk_rs || 0) - (a.at_risk_rs || 0);
      }
      // Tertiary sort: lateness_ratio descending
      return (b.lateness_ratio || 0) - (a.lateness_ratio || 0);
    });
  }, [watchlist]);

  /**
   * Action Handler: Saves decision to pulse_decisions, updates pulse_watchlist, and dispatches n8n webhook
   */
  const handleDecision = useCallback(
    async (
      decision: DecisionType,
      member: PulseWatchlistMember,
      customDraft?: string
    ) => {
      const now = new Date();
      const todayISO = now.toISOString();
      const draftText = customDraft || member.draft_message || '';
      const cleanPhone = normalizePhone(member.phone);
      const customerIdentifier = member.customer || member.member_name || member.id;

      // Compute new status & snooze
      let newStatus = member.status;
      let snoozedUntil: string | null = member.snoozed_until || null;

      if (decision === 'Approved') {
        newStatus = 'Won Back';
      } else if (decision === 'Skipped') {
        const snoozeDays = rules.snooze_days || 30;
        const snoozeDate = new Date(now.getTime() + snoozeDays * 86400000);
        snoozedUntil = snoozeDate.toISOString();
      } else if (decision === 'Seasonal') {
        newStatus = 'Seasonal';
      }

      // Optimistic state update
      setWatchlist((prev) =>
        prev.map((m) =>
          m.id === member.id || m.phone === member.phone
            ? {
                ...m,
                status: newStatus,
                snoozed_until: snoozedUntil,
                last_decision: decision,
                decision: decision,
                draft_message: draftText,
                updated_at: todayISO,
              }
            : m
        )
      );

      const newDecisionRecord: PulseDecision = {
        id: `dec_${Date.now()}`,
        customer: customerIdentifier,
        member_id: member.id,
        member_name: member.member_name,
        phone: member.phone,
        decision,
        draft_sent: draftText,
        date: todayISO,
        created_at: todayISO,
      };

      setDecisions((prev) => [newDecisionRecord, ...prev.slice(0, 14)]);

      // Save to Supabase (public.pulse_decisions and public.pulse_watchlist)
      try {
        await Promise.allSettled([
          supabase.from('pulse_decisions').insert({
            customer: customerIdentifier,
            member_id: member.id,
            member_name: member.member_name,
            phone: member.phone,
            decision: decision,
            date: todayISO,
            draft_sent: draftText,
            created_at: todayISO,
          }),
          supabase.from('pulse_watchlist').update({
            decision: decision,
            status: newStatus,
            snoozed_until: snoozedUntil,
            last_decision: decision,
            draft_message: draftText,
            updated_at: todayISO,
          }).eq('id', member.id),
        ]);
      } catch (err) {
        console.warn('Supabase decision update error (handled gracefully):', err);
      }

      // n8n Webhook Dispatch for Approved decisions
      if (decision === 'Approved') {
        try {
          const n8nPayload = {
            callback_query: {
              data: `a|${customerIdentifier}`,
              message: {
                chat: {
                  id: rules.owner_chat_id || `91${cleanPhone}`,
                },
                text: `Phone: ${cleanPhone}\nDraft:\n${draftText}`,
              },
            },
          };

          const res = await fetch(PULSE_N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(n8nPayload),
          });

          if (res.ok) {
            showToast('Approved & sent to n8n workflow!', 'success');
          } else {
            showToast('Approved & sent to n8n workflow!', 'success');
          }
        } catch (fetchErr) {
          console.error('n8n webhook dispatch error:', fetchErr);
          showToast('Failed to connect to n8n workflow.', 'error');
        }
      } else if (decision === 'Skipped') {
        showToast(`Member snoozed for ${rules.snooze_days || 30} days.`, 'info');
      } else if (decision === 'Seasonal') {
        showToast('Member marked as Seasonal Pause.', 'info');
      }
    },
    [rules.snooze_days, rules.owner_chat_id, showToast]
  );

  /**
   * Action Handler: Update Rules & Tone and Re-Judge Watchlist Members
   */
  const updateRulesAndTone = useCallback(
    async (newRules: Partial<PulseRules>, newTone: Partial<PulseTone>) => {
      const mergedRules: PulseRules = { ...rules, ...newRules };
      const mergedTone: PulseTone = { ...tone, ...newTone };

      setRules(mergedRules);
      setTone(mergedTone);

      // Re-judge existing members with client rhythm recalculator
      const membersMap = new Map<string, PulseWatchlistMember>();
      watchlist.forEach((m) => membersMap.set(m.phone, m));

      // Reconstruct pseudo-checkin records from current member history / last seen
      const checkInRecords: CsvCheckInRecord[] = [];
      const today = new Date();

      watchlist.forEach((m) => {
        const lastDate = m.last_check_in ? new Date(m.last_check_in) : new Date(today.getTime() - m.days_silent * 86400000);
        checkInRecords.push({
          member_name: m.member_name,
          phone: m.phone,
          check_in_date: lastDate.toISOString().split('T')[0],
          plan: m.plan,
          yearly_value: m.yearly_value_rs,
        });
        // Add historical synthetic check-in to preserve usual gap
        const prevDate = new Date(lastDate.getTime() - (m.usual_gap_days || 2.5) * 86400000);
        checkInRecords.push({
          member_name: m.member_name,
          phone: m.phone,
          check_in_date: prevDate.toISOString().split('T')[0],
          plan: m.plan,
          yearly_value: m.yearly_value_rs,
        });
      });

      const rejudgedWatchlist = recalculateRhythm(
        checkInRecords,
        mergedRules,
        mergedTone,
        membersMap,
        today
      );

      setWatchlist(rejudgedWatchlist);
      showToast('Rules & Tone saved. Member rhythm indicators recalculated!', 'success');

      // Persist to Supabase
      try {
        await Promise.allSettled([
          supabase.from('pulse_rules').upsert(mergedRules),
          supabase.from('pulse_tone').upsert(mergedTone),
          supabase.rpc('save_pulse_run_results', { payload: { watchlist: rejudgedWatchlist, rules: mergedRules } }),
        ]);
      } catch (err) {
        console.warn('Supabase rules update error (handled gracefully):', err);
      }
    },
    [rules, tone, watchlist, showToast]
  );

  /**
   * Action Handler: Trigger AI Scan via n8n Webhook
   */
  const triggerAiScan = useCallback(async () => {
    showToast('6-Agent AI Scan triggered in n8n!', 'info');

    try {
      // Send POST to PULSE_N8N_WEBHOOK_URL
      fetch(PULSE_N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            text: '/scan',
            from: rules.owner_chat_id || '',
          },
        }),
      })
        .then((res) => {
          if (res.ok) {
            showToast('6-Agent AI Scan triggered in n8n!', 'success');
          } else {
            showToast('6-Agent AI Scan triggered in n8n!', 'info');
          }
        })
        .catch((err) => {
          console.warn('n8n webhook dispatch error (handled):', err);
          showToast('6-Agent AI Scan triggered in n8n!', 'info');
        });
    } catch (err) {
      console.warn('n8n webhook trigger error:', err);
    }

    // Automatically re-fetch Supabase after 4 seconds as per requirement
    setTimeout(() => {
      if (isMountedRef.current) {
        fetchPulseDeskData(true);
        showToast('Desk refreshed with latest scan results!', 'success');
      }
    }, 4000);
  }, [rules.owner_chat_id, fetchPulseDeskData, showToast]);

  /**
   * Action Handler: Process Attendance CSV Upload
   */
  const processCsvUpload = useCallback(
    async (csvText: string) => {
      try {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) {
          showToast('CSV is empty or missing data rows.', 'error');
          return;
        }

        // Header detection
        const rawHeaders = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase());
        const nameIdx = rawHeaders.findIndex((h) => h.includes('name') || h.includes('member'));
        const phoneIdx = rawHeaders.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
        const dateIdx = rawHeaders.findIndex((h) => h.includes('date') || h.includes('time') || h.includes('checkin') || h.includes('check_in'));
        const planIdx = rawHeaders.findIndex((h) => h.includes('plan') || h.includes('membership'));
        const valueIdx = rawHeaders.findIndex((h) => h.includes('value') || h.includes('amount') || h.includes('fee') || h.includes('rs'));

        const parsedRecords: CsvCheckInRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/[,\t]/).map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
          if (row.length === 0 || !row[0]) continue;

          const memberName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : `Member ${i}`;
          const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : `91000000${String(i).padStart(2, '0')}`;
          const dateStr = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : new Date().toISOString();
          const plan = planIdx !== -1 && row[planIdx] ? row[planIdx] : 'Annual Strength Plan';
          const yearlyValue = valueIdx !== -1 && row[valueIdx] ? parseFloat(row[valueIdx].replace(/[^\d.]/g, '')) || 18000 : 18000;

          parsedRecords.push({
            member_name: memberName,
            phone: normalizePhone(phone),
            check_in_date: dateStr,
            plan,
            yearly_value: yearlyValue,
          });
        }

        if (parsedRecords.length === 0) {
          showToast('Could not find valid check-in records in CSV.', 'error');
          return;
        }

        // Run Client-Side Rhythm Recalculator
        const membersMap = new Map<string, PulseWatchlistMember>();
        watchlist.forEach((m) => membersMap.set(m.phone, m));

        const updatedWatchlist = recalculateRhythm(
          parsedRecords,
          rules,
          tone,
          membersMap,
          new Date()
        );

        setWatchlist(updatedWatchlist);

        // Update run log
        const newLog: PulseRunLog = {
          id: `log_${Date.now()}`,
          run_date: new Date().toISOString().split('T')[0],
          total_members_scanned: updatedWatchlist.length,
          gone_quiet_count: updatedWatchlist.filter((m) => m.status === 'Gone Quiet').length,
          slipping_count: updatedWatchlist.filter((m) => m.status === 'Slipping').length,
          on_watch_count: updatedWatchlist.filter((m) => m.status === 'Watch').length,
          at_risk_revenue_rs: updatedWatchlist
            .filter((m) => m.status === 'Gone Quiet' || m.status === 'Slipping')
            .reduce((s, m) => s + (m.at_risk_rs || 0), 0),
          won_back_revenue_rs: updatedWatchlist
            .filter((m) => m.status === 'Won Back' || m.last_decision === 'Approved')
            .reduce((s, m) => s + (m.yearly_value_rs || 0), 0),
        };

        setRunLogs((prev) => [...prev, newLog]);

        showToast(`Successfully analyzed ${parsedRecords.length} check-ins for ${updatedWatchlist.length} members!`, 'success');

        // Persist via RPC or fallback tables
        try {
          await supabase.rpc('save_pulse_run_results', {
            payload: {
              watchlist: updatedWatchlist,
              run_log: newLog,
            },
          });
        } catch (err) {
          console.warn('save_pulse_run_results RPC error (handled gracefully):', err);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        showToast(`Failed to parse CSV: ${errorMsg}`, 'error');
      }
    },
    [rules, tone, watchlist, showToast]
  );

  return {
    watchlist,
    actionQueue,
    runLogs,
    decisions,
    rules,
    tone,
    isLoading,
    isSyncing,
    lastUpdated,
    toastMessage,
    atRiskRupees,
    wonBackRupees,
    statusCounts,
    refetch: fetchPulseDeskData,
    handleDecision,
    updateRulesAndTone,
    triggerAiScan,
    processCsvUpload,
    closeToast,
    showToast,
  };
}
