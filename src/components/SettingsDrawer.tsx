import React, { useState } from 'react';
import { PulseRules, PulseTone } from '../types';
import { X, Sliders, MessageSquare, Shield, Check, Save } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rules: PulseRules;
  tone: PulseTone;
  onSave: (rules: Partial<PulseRules>, tone: Partial<PulseTone>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  rules,
  tone,
  onSave,
}) => {
  const [formData, setFormData] = useState<PulseRules>({ ...rules });
  const [toneData, setToneData] = useState<PulseTone>({ ...tone });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSave(formData, toneData);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#0c1222] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Rules & Coach Tone Settings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fine-tune rhythm multipliers and Hinglish coach persona
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} id="settings-form" className="py-5 space-y-6">
              {/* Section 1: Studio & Rhythm Multipliers */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Rhythm Engine Thresholds (pulse_rules)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Gym / Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) =>
                        setFormData({ ...formData, business_name: e.target.value })
                      }
                      className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Owner WhatsApp Phone (n8n Scan Target)
                    </label>
                    <input
                      type="text"
                      value={formData.owner_chat_id}
                      onChange={(e) =>
                        setFormData({ ...formData, owner_chat_id: e.target.value })
                      }
                      placeholder="e.g. 91XXXXXXXXXX"
                      className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Slipping Multiplier (× usual)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="1"
                        value={formData.slipping_multiplier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slipping_multiplier: parseFloat(e.target.value) || 1.75,
                          })
                        }
                        className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Gone Quiet Multiplier (× usual)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="2"
                        value={formData.gone_quiet_multiplier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gone_quiet_multiplier: parseFloat(e.target.value) || 3.0,
                          })
                        }
                        className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Snooze Duration (Days)
                      </label>
                      <input
                        type="number"
                        min="7"
                        max="90"
                        value={formData.snooze_days}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            snooze_days: parseInt(e.target.value, 10) || 30,
                          })
                        }
                        className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Currency Symbol
                      </label>
                      <input
                        type="text"
                        value={formData.currency_symbol}
                        onChange={(e) =>
                          setFormData({ ...formData, currency_symbol: e.target.value })
                        }
                        className="w-full text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Coach Tone & Voice */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Coach Tone & Hinglish Persona (pulse_tone)
                </h4>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Coach Name
                      </label>
                      <input
                        type="text"
                        value={toneData.coach_name}
                        onChange={(e) =>
                          setToneData({ ...toneData, coach_name: e.target.value })
                        }
                        className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Urgency & Tone Level
                      </label>
                      <select
                        value={toneData.urgency_level}
                        onChange={(e) =>
                          setToneData({
                            ...toneData,
                            urgency_level: e.target.value as any,
                          })
                        }
                        className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Gentle">Gentle & Supportive</option>
                        <option value="Balanced">Balanced & Friendly</option>
                        <option value="High Energy">High Energy & Hype</option>
                        <option value="Direct Accountability">Direct Accountability</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Gym Vibe / Identity
                    </label>
                    <input
                      type="text"
                      value={toneData.gym_vibe}
                      onChange={(e) =>
                        setToneData({ ...toneData, gym_vibe: e.target.value })
                      }
                      className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Sample Message Template ({`<=`} 280 chars)
                    </label>
                    <textarea
                      rows={3}
                      value={toneData.sample_template}
                      onChange={(e) =>
                        setToneData({ ...toneData, sample_template: e.target.value })
                      }
                      className="w-full text-xs rounded-xl bg-slate-900 border border-slate-800 p-3 text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Save Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              form="settings-form"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>Save & Re-Judge Members</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
