import {
  PulseWatchlistMember,
  PulseRules,
  PulseTone,
  CsvCheckInRecord,
  MemberStatus,
} from '../types';

/**
 * Computes median of an array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Computes Median Absolute Deviation (MAD)
 */
export function calculateMAD(numbers: number[], median: number): number {
  if (numbers.length === 0) return 0;
  const absoluteDeviations = numbers.map((n) => Math.abs(n - median));
  return calculateMedian(absoluteDeviations);
}

/**
 * Normalizes phone numbers strictly to 10 digits (handling +91, 0, spaces)
 */
export function normalizePhone(rawPhone: string | number): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Generates an editable, natural Hinglish coach draft (strictly <= 280 chars)
 */
export function generateHinglishDraft(
  memberName: string,
  daysSilent: number,
  status: MemberStatus,
  tone: PulseTone,
  usualGap: number
): string {
  const firstName = (memberName || 'bhai').trim().split(' ')[0] || 'Member';
  const coach = tone.coach_name || 'Coach';
  const vibe = tone.gym_vibe || 'Fitness Club';

  let message = '';
  if (status === 'Gone Quiet' || daysSilent >= 20) {
    message = `Hey ${firstName}! ${coach} here from ${vibe}. Kafi dino (${daysSilent} din) se apka workout miss ho raha hai bhai. Sab theek? Koi injury ya busy schedule? Aaj ek light recovery session karein? Let me know! 💪`;
  } else if (status === 'Slipping' || daysSilent >= 10) {
    message = `Hey ${firstName}! ${coach} from ${vibe}. Missed you at the gym! ${daysSilent} din se flow break hua hai. Aise momentum lose mat karo bro. Aaj evening me milte hain for a quick set? 🏋️`;
  } else if (status === 'Watch') {
    message = `Hi ${firstName}! Coach ${coach} here. Noticed last check-in was ${daysSilent} days ago vs usual ${usualGap.toFixed(0)}d rhythm. Aaj aa rahe ho na session ke liye? Let me know if you need any form checks!`;
  } else if (status === 'Seasonal') {
    message = `Hi ${firstName}! Hope all is well. Understand exam/festival season chal raha hai. Jab bhi time mile 20 min stretch/cardio ke liye drop in kar lena. Stay active! - ${coach}`;
  } else {
    message = `Hey ${firstName}! Coach ${coach} here from ${vibe}. Great consistency on your workouts recently! Keep crushing your personal records! 🔥`;
  }

  // Ensure strict <= 280 characters limit
  if (message.length > 280) {
    return message.slice(0, 277) + '...';
  }
  return message;
}

/**
 * Generates insightful likely reason based on metrics
 */
export function generateLikelyReason(
  daysSilent: number,
  latenessRatio: number,
  steadiness: number,
  seasonalPattern: boolean
): string {
  if (seasonalPattern) {
    return 'Seasonal drop matching last year’s cycle (Festive / Exams / Family travel)';
  }
  if (daysSilent >= 25) {
    return 'High churn hazard: Habit break >3 weeks with lost gym momentum';
  }
  if (steadiness <= 1.0 && latenessRatio >= 2.0) {
    return 'Sudden routine disruption: Previously had an ultra-disciplined rhythm';
  }
  if (steadiness > 2.5) {
    return 'Irregular weekend-warrior attendance leading to gradual dropout';
  }
  if (daysSilent >= 12) {
    return 'Post-workout fatigue, travel pause, or work deadline friction';
  }
  return 'Minor schedule deviation from regular training cycle';
}

/**
 * Client-Side Rhythm Recalculator
 * Processes raw check-ins or existing watchlist against current rules & tone
 */
export function recalculateRhythm(
  records: CsvCheckInRecord[],
  rules: PulseRules,
  tone: PulseTone,
  existingMembersMap: Map<string, PulseWatchlistMember> = new Map(),
  referenceDate: Date = new Date()
): PulseWatchlistMember[] {
  // Group by normalized 10-digit phone
  const grouped = new Map<string, {
    name: string;
    phone: string;
    plan: string;
    yearlyValue: number;
    dates: Date[];
  }>();

  records.forEach((record) => {
    const cleanPhone = normalizePhone(record.phone);
    if (!cleanPhone || cleanPhone.length < 10) return;

    const parsedDate = new Date(record.check_in_date);
    if (isNaN(parsedDate.getTime())) return;

    if (!grouped.has(cleanPhone)) {
      grouped.set(cleanPhone, {
        name: record.member_name || 'Member',
        phone: cleanPhone,
        plan: record.plan || 'Annual Pro Membership',
        yearlyValue: record.yearly_value || 18000,
        dates: [],
      });
    }

    grouped.get(cleanPhone)!.dates.push(parsedDate);
  });

  const results: PulseWatchlistMember[] = [];

  grouped.forEach((data, phone) => {
    // Sort timestamps ascending and deduplicate by calendar date
    const uniqueDayTimestamps = Array.from(
      new Set(
        data.dates
          .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
      )
    ).sort((a, b) => a - b);

    let usualGap = 2.5;
    let steadinessMAD = 1.0;

    if (uniqueDayTimestamps.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < uniqueDayTimestamps.length; i++) {
        const diffDays = (uniqueDayTimestamps[i] - uniqueDayTimestamps[i - 1]) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) gaps.push(diffDays);
      }
      if (gaps.length > 0) {
        usualGap = Math.max(1, calculateMedian(gaps));
        steadinessMAD = calculateMAD(gaps, usualGap);
      }
    }

    // Last check-in
    const lastTimestamp =
      uniqueDayTimestamps.length > 0
        ? uniqueDayTimestamps[uniqueDayTimestamps.length - 1]
        : referenceDate.getTime();
    const lastDate = new Date(lastTimestamp);

    const refTime = referenceDate.getTime();
    const daysSilent = Math.max(
      0,
      Math.floor((refTime - lastTimestamp) / (1000 * 60 * 60 * 24))
    );

    // Lateness Ratio calculation:
    // lateness_ratio = days_silent / (usual_gap * (1 + 0.5 * Math.min(steadiness, 1)))
    const latenessRatio = parseFloat(
      (daysSilent / (usualGap * (1 + 0.5 * Math.min(steadinessMAD, 1)))).toFixed(2)
    );

    // Existing record context
    const existing = existingMembersMap.get(phone);
    const snoozedUntil = existing?.snoozed_until || null;
    const isSnoozed =
      snoozedUntil && new Date(snoozedUntil).getTime() > refTime;

    // Seasonal Guard: check if member had seasonal flag or historical drop 365 days ago
    let seasonalPattern = existing?.seasonal_pattern_detected || false;
    // Check if check-in history shows drop in this month last year
    const lastYearMonth = (referenceDate.getMonth());
    const hasLastYearCheckinInSameMonth = uniqueDayTimestamps.some((t) => {
      const d = new Date(t);
      return (
        d.getFullYear() === referenceDate.getFullYear() - 1 &&
        d.getMonth() === lastYearMonth
      );
    });
    if (!hasLastYearCheckinInSameMonth && uniqueDayTimestamps.some(t => new Date(t).getFullYear() === referenceDate.getFullYear() - 1)) {
      // Member had gym activity last year but was silent in this exact month
      seasonalPattern = true;
    }

    // Determine status
    let status: MemberStatus = 'Healthy';
    const goneQuietMult = rules.gone_quiet_multiplier || 3.0;
    const slippingMult = rules.slipping_multiplier || 1.75;
    const watchMult = rules.watch_multiplier || 1.25;

    if (existing?.status === 'Won Back' && daysSilent < (usualGap * 1.5)) {
      status = 'Won Back';
    } else if (existing?.status === 'Seasonal' || seasonalPattern) {
      status = 'Seasonal';
    } else if (isSnoozed) {
      status = existing?.status || 'Watch';
    } else if (latenessRatio >= goneQuietMult || daysSilent >= 21) {
      status = 'Gone Quiet';
    } else if (latenessRatio >= slippingMult || daysSilent >= 10) {
      status = 'Slipping';
    } else if (latenessRatio >= watchMult) {
      status = 'Watch';
    } else {
      status = 'Healthy';
    }

    // Revenue calculations
    const yearlyValue = data.yearlyValue || 18000;
    let atRiskRs = 0;
    if (status === 'Gone Quiet') {
      atRiskRs = yearlyValue;
    } else if (status === 'Slipping') {
      atRiskRs = Math.round(yearlyValue * 0.7);
    } else if (status === 'Watch') {
      atRiskRs = Math.round(yearlyValue * 0.35);
    }

    const likelyReason = generateLikelyReason(
      daysSilent,
      latenessRatio,
      steadinessMAD,
      status === 'Seasonal'
    );

    const draftMessage = generateHinglishDraft(
      data.name,
      daysSilent,
      status,
      tone,
      usualGap
    );

    results.push({
      id: existing?.id || `mem_${phone}`,
      member_name: data.name,
      phone: phone,
      status: status,
      plan: data.plan,
      yearly_value_rs: yearlyValue,
      at_risk_rs: atRiskRs,
      days_silent: daysSilent,
      usual_gap_days: parseFloat(usualGap.toFixed(1)),
      steadiness_mad: parseFloat(steadinessMAD.toFixed(2)),
      lateness_ratio: latenessRatio,
      last_check_in: lastDate.toISOString().split('T')[0],
      likely_reason: likelyReason,
      suggested_action:
        status === 'Gone Quiet'
          ? 'Call & Personal Re-Engagement Offer'
          : status === 'Slipping'
          ? 'Send WhatsApp Check-In & Slot Booking'
          : status === 'Watch'
          ? 'Monitor Attendance Next 48h'
          : status === 'Seasonal'
          ? 'Keep in Seasonal Pause / Warm Greeting'
          : 'Maintain Regular Routine',
      draft_message: draftMessage,
      coach_assigned: tone.coach_name || 'Coach',
      snoozed_until: snoozedUntil,
      last_decision: existing?.last_decision || null,
      seasonal_pattern_detected: seasonalPattern,
      updated_at: new Date().toISOString(),
    });
  });

  return results;
}
