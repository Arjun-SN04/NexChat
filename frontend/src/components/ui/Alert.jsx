import { AnimatePresence, motion } from 'motion/react'
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu'

const STYLES = {
  error: { box: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300', Icon: LuCircleAlert },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300', Icon: LuCircleCheck },
}

// Animated alert. Renders nothing when `message` is empty.
const Alert = ({ type = 'error', message, className = '' }) => {
  const { box, Icon } = STYLES[type]
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={type + message}
          role="alert"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`overflow-hidden ${className}`}
        >
          <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${box}`}>
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Alert
