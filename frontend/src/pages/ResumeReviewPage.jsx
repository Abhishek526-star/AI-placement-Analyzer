import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.js';
import { CheckCircle2, ShieldCheck, Plus, X, ArrowRight, Save, User, BookOpen, Briefcase, Code, Sparkles, Loader2, FileText } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { ColorfulButton } from '../components/ui/ColorfulButton.jsx';
import { SkeletonProfileReview } from '../components/ui/Skeletons.jsx';

export function ResumeReviewPage({ resumeId, onConfirmSuccess, onBack }) {
  const { toast } = useToast();
  const [resume, setResume] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('skills');

  useEffect(() => {
    apiClient(`/resumes/${resumeId}?include_signed_url=true`)
      .then((data) => {
        setResume(data);
        setProfile(data.profile?.parsed_data || {});
        setSkills(data.skills || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load resume details:', err);
        setLoading(false);
      });
  }, [resumeId]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const skillName = newSkill.trim();
    if (skills.some((s) => s.skill_name.toLowerCase() === skillName.toLowerCase())) {
      setNewSkill('');
      return;
    }
    setSkills([...skills, { skill_name: skillName, section: 'skills', evidence_text: 'Added by candidate' }]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillName) => {
    setSkills(skills.filter((s) => s.skill_name !== skillName));
  };

  const handleSaveAndConfirm = async () => {
    setSaving(true);
    try {
      await apiClient(`/resumes/${resumeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_user_confirmed: true,
          parsed_data: profile,
          skills_upsert: skills
        })
      });
      setSaving(false);
      toast.success('Profile confirmed and saved successfully!', 'Profile Saved');
      onConfirmSuccess(resumeId);
    } catch (err) {
      toast.error(err.message || 'Unknown error', 'Failed to Save Profile');
      setSaving(false);
    }
  };

  if (loading) {
    return <SkeletonProfileReview />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bento Card */}
      <div className="bento-card p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Review Extracted Profile
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono-numbers font-bold border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              ● Extraction Confidence: {Math.round((resume?.profile?.extraction_confidence || 0.85) * 100)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            File: <span className="font-mono text-foreground font-semibold">{resume?.filename}</span> (Version {resume?.version}) • Verify your extracted experience before matching.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onBack && (
            <ColorfulButton variant="glass" size="md" onClick={onBack}>
              Back
            </ColorfulButton>
          )}

          <ColorfulButton
            variant="emerald"
            size="md"
            icon={CheckCircle2}
            loading={saving}
            loadingText="Saving..."
            onClick={handleSaveAndConfirm}
          >
            Confirm & Continue to JD
          </ColorfulButton>
        </div>
      </div>

      {/* Split-Pane Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Pane (7 cols): Editable Form */}
        <div className="lg:col-span-7 space-y-4">
          {/* Bento Sub Navigation Pill Tabs */}
          <div className="bento-card p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'skills', label: `Skills (${skills.length})`, icon: Code },
              { id: 'contact', label: 'Contact', icon: User },
              { id: 'experience', label: `Experience (${profile?.experience?.length || 0})`, icon: Briefcase },
              { id: 'projects', label: `Projects (${profile?.projects?.length || 0})`, icon: Briefcase },
              { id: 'education', label: `Education (${profile?.education?.length || 0})`, icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-display font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 select-none ${
                    isActive
                      ? 'bg-primary/20 text-foreground border border-primary/40 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Skills Tab Content */}
          {activeTab === 'skills' && (
            <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
              <div>
                <h3 className="font-display font-bold text-foreground text-sm">
                  Extracted & Verified Skills ({skills.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These skills will be matched against target job descriptions. You can add missing skills or remove incorrect detections.
                </p>
              </div>

              {/* Add Skill Input */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill (e.g., PostgreSQL, Docker, Next.js)..."
                  className="flex-1 px-3.5 py-2 text-xs font-mono-numbers rounded-xl border border-border bg-background/80 text-foreground focus:outline-none focus:border-primary/60"
                />
                <ColorfulButton type="submit" variant="cobalt" size="sm" icon={Plus}>
                  Add
                </ColorfulButton>
              </form>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2 pt-2 max-h-[380px] overflow-y-auto">
                {skills.map((s) => (
                  <span
                    key={s.skill_name}
                    className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-bold bg-primary/10 text-primary border border-primary/25"
                  >
                    <span>{s.skill_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.skill_name)}
                      className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Tab Content */}
          {activeTab === 'contact' && (
            <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4 text-sm">
              <h3 className="font-display font-bold text-foreground text-sm">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile?.contact?.full_name || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, full_name: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background/80 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={profile?.contact?.email || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, email: e.target.value }
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background/80 text-foreground font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profile?.contact?.phone || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, phone: e.target.value }
                      })
                    }
                    placeholder="+91-XXXXXXXXXX"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background/80 text-foreground font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={profile?.contact?.linkedin || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, linkedin: e.target.value }
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background/80 text-foreground font-mono-numbers"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">GitHub Profile</label>
                  <input
                    type="text"
                    value={profile?.contact?.github || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, github: e.target.value }
                      })
                    }
                    placeholder="https://github.com/username"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background/80 text-foreground font-mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab Content */}
          {activeTab === 'experience' && (
            <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground text-sm">Work Experience & Internships</h3>
                <span className="text-xs font-mono-numbers text-muted-foreground">
                  {profile?.experience?.length || 0} {profile?.experience?.length === 1 ? 'entry' : 'entries'} found
                </span>
              </div>
              {profile?.experience?.length > 0 ? (
                profile.experience.map((exp, idx) => {
                  const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
                    ? exp.bullets
                    : (exp.description ? exp.description.split('\n').filter(Boolean) : []);
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border/50 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-display font-bold text-sm text-foreground">{exp.company}</span>
                        {exp.duration && (
                          <span className="text-xs text-primary font-mono-numbers font-semibold">{exp.duration}</span>
                        )}
                      </div>
                      {exp.role && <p className="text-xs font-semibold text-muted-foreground">{exp.role}</p>}
                      {bullets.length > 0 && (
                        <ul className="list-disc list-outside pl-4 space-y-1 pt-1 text-xs text-muted-foreground leading-relaxed">
                          {bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b.replace(/^[•\-\*–]\s*/, '')}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">No experience automatically parsed. You can verify against the text on the right.</p>
              )}
            </div>
          )}

          {/* Projects Tab Content */}
          {activeTab === 'projects' && (
            <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground text-sm">Extracted Projects</h3>
                <span className="text-xs font-mono-numbers text-muted-foreground">
                  {profile?.projects?.length || 0} {profile?.projects?.length === 1 ? 'project' : 'projects'} found
                </span>
              </div>
              {profile?.projects?.length > 0 ? (
                profile.projects.map((proj, idx) => {
                  const bullets = Array.isArray(proj.bullets) && proj.bullets.length > 0
                    ? proj.bullets
                    : (proj.description ? proj.description.split('\n').filter(Boolean) : []);
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border/50 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-display font-bold text-sm text-foreground">{proj.name}</span>
                        {proj.duration && (
                          <span className="text-xs text-primary font-mono-numbers font-semibold">{proj.duration}</span>
                        )}
                      </div>
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {proj.technologies.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-mono-numbers font-bold bg-primary/10 text-primary border border-primary/20">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {bullets.length > 0 && (
                        <ul className="list-disc list-outside pl-4 space-y-1 pt-1 text-xs text-muted-foreground leading-relaxed">
                          {bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b.replace(/^[•\-\*–]\s*/, '')}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground">No projects automatically parsed. You can verify against the text on the right.</p>
              )}
            </div>
          )}

          {/* Education Tab Content */}
          {activeTab === 'education' && (
            <div className="bento-card p-6 sm:p-7 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground text-sm">Education Details</h3>
                <span className="text-xs font-mono-numbers text-muted-foreground">
                  {profile?.education?.length || 0} degrees/institutions
                </span>
              </div>
              {profile?.education?.length > 0 ? (
                profile.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-card/60 border border-border/50 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-display font-bold text-sm text-foreground">{edu.degree || 'Degree / Certificate'}</span>
                      {edu.score && (
                        <span className="text-xs font-mono-numbers font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {edu.score}
                        </span>
                      )}
                    </div>
                    {edu.institution && (
                      <p className="text-xs text-foreground/80 font-medium">{edu.institution}</p>
                    )}
                    {edu.graduation_year && (
                      <p className="text-[11px] text-muted-foreground font-mono-numbers italic">Timeline: {edu.graduation_year}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No education history parsed.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Pane (5 cols): Verbatim Reference Viewer */}
        <div className="lg:col-span-5 bento-card p-6 sm:p-7 rounded-3xl space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span>Resume Reference Viewer</span>
            </h3>
            <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase font-bold">
              Verbatim Chunks
            </span>
          </div>
          <div className="h-[520px] overflow-y-auto p-4 rounded-2xl bg-card/60 border border-border/50 text-xs text-muted-foreground font-mono-numbers leading-relaxed whitespace-pre-wrap">
            {resume?.extracted_text || 'No extracted text available.'}
          </div>
        </div>
      </div>
    </div>
  );
}
