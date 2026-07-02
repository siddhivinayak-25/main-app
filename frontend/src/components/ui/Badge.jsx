const styles = {
  Live: 'bg-brand-violet-light text-brand-violet-dark border-brand-violet/30',
  Draft: 'bg-slate-100 text-slate-500 border-slate-200',
  Completed: 'bg-slate-100 text-slate-600 border-slate-200',
  'In Progress': 'bg-brand-violet-light text-brand-violet-dark border-brand-violet/30',
  Shortlisted: 'bg-brand-violet-light text-brand-violet-dark border-brand-violet/30',
  Hired: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export default function Badge({ status }) {
  const style = styles[status] || styles.Draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}