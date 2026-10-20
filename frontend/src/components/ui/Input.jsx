import { forwardRef, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LuEye, LuEyeOff, LuCircleAlert } from 'react-icons/lu'

const Input = forwardRef(
  ({ label, icon: Icon, error, hint, type = 'text', id, className = '', ...rest }, ref) => {
    const autoId = useId()
    const inputId = id || autoId
    const [visible, setVisible] = useState(false)
    const isPassword = type === 'password'

    const stateClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
      : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-slate-700 dark:hover:border-slate-600'

    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && visible ? 'text' : type}
            aria-invalid={!!error}
            className={[
              'h-12 w-full rounded-xl border bg-white text-sm text-slate-900 shadow-xs outline-none dark:bg-slate-900 dark:text-slate-100',
              'placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150 focus:ring-4',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-500 dark:placeholder:text-slate-500',
              Icon ? 'pl-10' : 'pl-3.5',
              isPassword ? 'pr-11' : 'pr-3.5',
              stateClasses,
            ].join(' ')}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              {visible ? <LuEyeOff className="size-4" /> : <LuEye className="size-4" />}
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-xs text-red-600"
            >
              <LuCircleAlert className="size-3.5 shrink-0" />
              {error}
            </motion.p>
          ) : (
            hint && <p className="pt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
