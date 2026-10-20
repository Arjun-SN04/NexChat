import { LuLoaderCircle } from 'react-icons/lu'

const Spinner = ({ className = 'size-5' }) => (
  <LuLoaderCircle className={`animate-spin ${className}`} aria-label="Loading" />
)

export default Spinner
