import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.js';
import { CheckCircle2, ShieldCheck, Plus, X, ArrowRight, Save, User, BookOpen, Briefcase, Code, Sparkles, Loader2 } from 'lucide-react';

export function ResumeReviewPage({ resumeId, onConfirmSuccess, onBack }) {
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
      onConfirmSuccess(resumeId);
    } catch (err) {
      alert('Failed to save profile: ' + (err.message || 'Unknown error'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Loading extracted resume details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Review Extracted Profile</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              Confidence: {Math.round((resume?.profile?.extraction_confidence || 0.85) * 100)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            File: <span className="font-semibold text-foreground">{resume?.filename}</span> (Version {resume?.version})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSaveAndConfirm}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Confirm & Continue to JD</span>
          </button>
        </div>
      </div>

      {/* Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane (7 cols): Editable Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'skills' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-primary" />
              <span>Skills ({skills.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contact' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'experience' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-500" />
              <span>Experience ({profile?.experience?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'projects' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-500" />
              <span>Projects ({profile?.projects?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'education' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>Education ({profile?.education?.length || 0})</span>
            </button>
          </div>

          {/* Skills Tab Content */}
          {activeTab === 'skills' && (
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Extracted & Verified Skills ({skills.length})</h3>
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
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2 pt-2 max-h-[360px] overflow-y-auto">
                {skills.map((s) => (
                  <span
                    key={s.skill_name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    <span>{s.skill_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.skill_name)}
                      className="p-0.5 hover:bg-primary/20 rounded-full"
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
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 text-sm">
              <h3 className="font-semibold text-foreground text-sm">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile?.contact?.full_name || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, full_name: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={profile?.contact?.email || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contact: { ...profile.contact, email: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Phone Number</label>
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">LinkedIn Profile</label>
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">GitHub Profile</label>
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab Content */}
          {activeTab === 'experience' && (
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Work Experience & Internships</h3>
                <span className="text-xs text-muted-foreground">{profile?.experience?.length || 0} {profile?.experience?.length === 1 ? 'entry' : 'entries'} found</span>
              </div>
              {profile?.experience?.length > 0 ? (
                profile.experience.map((exp, idx) => {
                  const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
                    ? exp.bullets
                    : (exp.description ? exp.description.split('\n').filter(Boolean) : []);
                  return (
                    <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-bold text-sm text-foreground">{exp.company}</span>
                        {exp.duration && (
                          <span className="text-xs text-primary font-medium">{exp.duration}</span>
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
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Extracted Projects</h3>
                <span className="text-xs text-muted-foreground">{profile?.projects?.length || 0} {profile?.projects?.length === 1 ? 'project' : 'projects'} found</span>
              </div>
              {profile?.projects?.length > 0 ? (
                profile.projects.map((proj, idx) => {
                  const bullets = Array.isArray(proj.bullets) && proj.bullets.length > 0
                    ? proj.bullets
                    : (proj.description ? proj.description.split('\n').filter(Boolean) : []);
                  return (
                    <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="font-bold text-sm text-foreground">{proj.name}</span>
                        {proj.duration && (
                          <span className="text-xs text-primary font-medium">{proj.duration}</span>
                        )}
                      </div>
                      {proj.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {proj.technologies.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
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
            <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Education Details</h3>
                <span className="text-xs text-muted-foreground">{profile?.education?.length || 0} {profile?.education?.length === 1 ? 'degree/institution' : 'degrees/institutions'}</span>
              </div>
              {profile?.education?.length > 0 ? (
                profile.education.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/40 border border-border space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="font-bold text-sm text-foreground">{edu.degree || 'Degree / Certificate'}</span>
                      {edu.score && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {edu.score}
                        </span>
                      )}
                    </div>
                    {edu.institution && (
                      <p className="text-xs text-foreground/80 font-medium">{edu.institution}</p>
                    )}
                    {edu.graduation_year && (
                      <p className="text-[11px] text-muted-foreground italic">Graduation / Timeline: {edu.graduation_year}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No education history parsed.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Pane (5 cols): Preview or Extracted Text */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-border bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">Resume Reference Viewer</h3>
            <span className="text-xs text-muted-foreground">Verbatim Raw Text</span>
          </div>
          <div className="h-[500px] overflow-y-auto p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
            {resume?.extracted_text || 'No extracted text available.'}
          </div>
        </div>
      </div>
    </div>
  );
}
