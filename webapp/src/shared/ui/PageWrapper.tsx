import { motion, HTMLMotionProps } from 'framer-motion';
import { modalScale } from '../animations';
import { useWebApp } from '../../hooks';

const desktopFade = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

export const PageWrapper = ({ children, className, ...props }: HTMLMotionProps<"div">) => {
  const { isDesktop } = useWebApp();

  return (
    <motion.div
      variants={isDesktop ? desktopFade : modalScale}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};