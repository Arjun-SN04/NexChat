import { motion } from 'motion/react'

const EASE = [0.22, 1, 0.36, 1]

// Wraps a page so it fades/slides in on enter and out on exit.
const PageTransition = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
    exit={{ opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } }}
    className={className}
  >
    {children}
  </motion.div>
)

// Fades content in when it scrolls into view.
export const Reveal = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
)

export default PageTransition
