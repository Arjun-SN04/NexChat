const Card = ({ className = '', children, ...rest }) => (
  <div
    className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
    {...rest}
  >
    {children}
  </div>
)

export default Card
