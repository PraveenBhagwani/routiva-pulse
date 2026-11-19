export type MemberStatus =
  | 'Gone Quiet'
  | 'Slipping'
  | 'Watch'
  | 'Seasonal'
  | 'Won Back'
  | 'Healthy';

export type DecisionType = 'Approved' | 'Skipped' | 'Seasonal';

export interface PulseWatchlistMember {
  id: string;
  customer?: string;
  member_name: string;
  phone: string;
  status: MemberStatus;
  plan?: string;
  yearly_value_rs: number;
  at_risk_rs: number;
  days_silent: number;
  usual_gap_days: number;
  steadiness_mad: number;
  lateness_ratio: number;
  last_check_in?: string;
  likely_reason?: string;
  suggested_action?: string;
  draft_message?: string;
  coach_assigned?: string;
  snoozed_until?: string | null;
  last_decision?: DecisionType | null;
  decision?: DecisionType | string | null;
  seasonal_pattern_detected?: boolean;
  attendance_history?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PulseRunLog {
  id: string;
  run_date: string;
  total_members_scanned: number;
  gone_quiet_count: number;
  slipping_count: number;
  on_watch_count: number;
  at_risk_revenue_rs: number;
  won_back_revenue_rs: number;
  created_at?: string;
}

export interface PulseDecision {
  id: string;
  customer?: string;
  member_id: string;
  member_name: string;
  phone: string;
  decision: DecisionType;
  draft_sent?: string;
  date?: string;
  created_at: string;
}

export interface PulseRules {
  id?: string;
  business_name: string;
  owner_chat_id: string;
  slipping_multiplier: number;
  gone_quiet_multiplier: number;
  watch_multiplier: number;
  snooze_days: number;
  min_checkins_for_baseline: number;
  currency_symbol: string;
  updated_at?: string;
}

export interface PulseTone {
  id?: string;
  coach_name: string;
  gym_vibe: string;
  language_blend: string;
  sample_template: string;
  urgency_level: 'Gentle' | 'Balanced' | 'High Energy' | 'Direct Accountability';
  custom_signature: string;
  updated_at?: string;
}

export interface PulseDeskData {
  watchlist: PulseWatchlistMember[];
  run_logs: PulseRunLog[];
  decisions: PulseDecision[];
  rules: PulseRules;
  tone: PulseTone;
}

export interface CsvCheckInRecord {
  member_name: string;
  phone: string;
  check_in_date: string; // YYYY-MM-DD or parseable date string
  plan?: string;
  yearly_value?: number;
}
