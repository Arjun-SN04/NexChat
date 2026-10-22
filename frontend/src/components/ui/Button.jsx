import { Link } from 'react-router-dom'
import Spinner from './Spinner'

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500 focus-visible:ring-indigo-500',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800',
  white: 'bg-white text-slate-900 shadow-sm hover:bg-slate-100 focus-visible:ring-white',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
}

// Drop size classes (rounded-, h-, px-) that `className` overrides, so custom
// shapes like "rounded-full" always win over the defaults.
const withOverrides = (base, extra) => {
  const extraPrefixes = extra.split(' ').map((c) => c.match(/^(rounded|h|px)-/)?.[1]).filter(Boolean)
  return base.split(' ').filter((c) => !extraPrefixes.includes(c.match(/^(rounded|h|px)-/)?.[1])).join(' ')
}

const Button = ({
  variant = 'primary',
  size = 'md',
  to,
  href,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  const classes = [
    'group/btn inline-flex items-center justify-center font-medium whitespace-nowrap select-none',
    'transition-all duration-150 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
    'disabled:opacity-60 disabled:pointer-events-none',
    VARIANTS[variant],
    withOverrides(SIZES[size], className),
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')

  const content = (
    <>
      {loading ? <Spinner className="size-4" /> : LeftIcon && <LeftIcon className="size-4 shrink-0" />}
      {children}
      {RightIcon && !loading && (
        <RightIcon className="size-4 shrink-0 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
      )}
    </>
  )

  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>
  if (href) return <a href={href} className={classes} {...rest}>{content}</a>
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}

export default Button
