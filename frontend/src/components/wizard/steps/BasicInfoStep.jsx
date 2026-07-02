import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, Clock, AlertCircle } from 'lucide-react';

const ROLE_OPTIONS = [
  'AI Engineer',
  'Backend Engineer',
  'Data Scientist',
  'Full Stack Developer',
  'DevOps Engineer',
  'Frontend Developer',
  'QA Engineer',
];

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL',
  'Machine Learning', 'Docker', 'Kubernetes', 'AWS', 'GraphQL',
  'REST APIs', 'Git', 'System Design', 'Data Structures', 'Algorithms',
  'CI/CD', 'Testing', 'CSS', 'HTML', 'Java', 'Go', 'Rust',
  'TensorFlow', 'PyTorch', 'MongoDB', 'PostgreSQL', 'Redis',
];

export default function BasicInfoStep({ formData, updateFormData, onNext }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [touched, setTouched] = useState({});
  const skillInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        skillInputRef.current &&
        !skillInputRef.current.contains(e.target)
      ) {
        setShowSkillSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const skills = formData.skills || [];

  const filteredSuggestions = SUGGESTED_SKILLS.filter(
    (s) =>
      !skills.includes(s) &&
      s.toLowerCase().includes(skillInput.toLowerCase())
  );

  function addSkill(skill) {
    if (!skills.includes(skill)) {
      updateFormData({ skills: [...skills, skill] });
    }
    setSkillInput('');
    skillInputRef.current?.focus();
  }

  function removeSkill(skill) {
    updateFormData({ skills: skills.filter((s) => s !== skill) });
  }

  function handleSkillKeyDown(e) {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput.trim());
    }
    if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      removeSkill(skills[skills.length - 1]);
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.testTitle?.trim()) newErrors.testTitle = 'Test title is required';
    if (!formData.role) newErrors.role = 'Please select a role';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    setTouched({ testTitle: true, role: true });
    if (validate()) onNext();
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (touched[field]) validate();
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-6 shadow-sm">
      {/* Section header */}
      <div className="mb-6">
        <h2 className="font-display font-semibold text-ink text-lg">Basic Information</h2>
        <p className="text-sm text-muted mt-1">Set up the foundational details for your new test</p>
      </div>

      <div className="space-y-5">
        {/* Test Title */}
        <div>
          <label htmlFor="testTitle" className="block text-sm font-medium text-muted mb-1.5">
            Test Title <span className="text-red-400">*</span>
          </label>
          <input
            id="testTitle"
            type="text"
            value={formData.testTitle || ''}
            onChange={(e) => updateFormData({ testTitle: e.target.value })}
            onBlur={() => handleBlur('testTitle')}
            placeholder="e.g. Senior React Developer Assessment"
            className={`w-full bg-surface border rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none transition-colors ${
              errors.testTitle && touched.testTitle
                ? 'border-red-400 focus:border-red-400'
                : 'border-surface-border focus:border-brand-violet/50'
            }`}
          />
          {errors.testTitle && touched.testTitle && (
            <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
              <AlertCircle size={12} /> {errors.testTitle}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-muted mb-1.5">
            Role <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              id="role"
              value={formData.role || ''}
              onChange={(e) => updateFormData({ role: e.target.value })}
              onBlur={() => handleBlur('role')}
              className={`w-full appearance-none bg-surface border rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none transition-colors cursor-pointer ${
                errors.role && touched.role
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-surface-border focus:border-brand-violet/50'
              } ${!formData.role ? 'text-muted/60' : ''}`}
            >
              <option value="" disabled>Select a role</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          {errors.role && touched.role && (
            <p className="flex items-center gap-1 mt-1.5 text-xs text-red-400">
              <AlertCircle size={12} /> {errors.role}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-muted mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe what this test evaluates, the expected skill level, and any special instructions..."
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand-violet/50 transition-colors resize-none"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Duration
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[180px]">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="duration"
                type="number"
                min={1}
                value={formData.duration || ''}
                onChange={(e) => updateFormData({ duration: e.target.value })}
                placeholder="60"
                className="w-full bg-surface border border-surface-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand-violet/50 transition-colors"
              />
            </div>
            <div className="relative">
              <select
                id="durationUnit"
                value={formData.durationUnit || 'minutes'}
                onChange={(e) => updateFormData({ durationUnit: e.target.value })}
                className="appearance-none bg-surface border border-surface-border rounded-lg px-4 py-2.5 pr-9 text-sm text-ink focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Skills to Evaluate */}
        <div>
          <label className="block text-sm font-medium text-muted mb-1.5">
            Skills to Evaluate
          </label>
          <div
            className="bg-surface border border-surface-border rounded-lg px-3 py-2 flex flex-wrap items-center gap-2 focus-within:border-brand-violet/50 transition-colors min-h-[42px] cursor-text"
            onClick={() => skillInputRef.current?.focus()}
          >
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-brand-violet-light text-brand-violet-dark text-xs font-medium px-2.5 py-1 rounded-md transition-all hover:shadow-sm group"
              >
                {skill}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                  className="ml-0.5 text-brand-violet-dark/50 hover:text-brand-violet-dark transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              ref={skillInputRef}
              type="text"
              value={skillInput}
              onChange={(e) => {
                setSkillInput(e.target.value);
                setShowSkillSuggestions(true);
              }}
              onFocus={() => setShowSkillSuggestions(true)}
              onKeyDown={handleSkillKeyDown}
              placeholder={skills.length === 0 ? 'Type to add skills...' : ''}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none py-0.5"
            />
          </div>

          {/* Skill suggestions dropdown */}
          {showSkillSuggestions && filteredSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="mt-1 bg-surface-card border border-surface-border rounded-lg shadow-lg max-h-44 overflow-y-auto z-20 relative"
            >
              {filteredSuggestions.slice(0, 10).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { addSkill(s); setShowSkillSuggestions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted mt-1.5">
            Type a skill name and press Enter, or pick from suggestions
          </p>
        </div>

        {/* Difficulty Level */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-muted mb-1.5">
            Difficulty Level
          </label>
          <div className="relative">
            <select
              id="difficulty"
              value={formData.difficulty || ''}
              onChange={(e) => updateFormData({ difficulty: e.target.value })}
              className={`w-full appearance-none bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer ${
                !formData.difficulty ? 'text-muted/60' : ''
              }`}
            >
              <option value="" disabled>Select difficulty</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-surface-border">
        <button
          onClick={() => navigate('/dashboard/tests')}
          className="px-5 py-2.5 rounded-lg border border-surface-border text-sm font-medium text-muted hover:text-ink hover:border-brand-violet/30 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          className="bg-brand-violet hover:bg-brand-violet-dark text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
