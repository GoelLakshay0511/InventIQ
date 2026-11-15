/**
 * LoadingSpinner — accessible centered spinner.
 *
 * Props:
 *   size?: 'sm' | 'md' | 'lg'  (default: 'md')
 */
const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-10 w-10 border-4',
  lg: 'h-16 w-16 border-4',
};

export default function LoadingSpinner({ size = 'md' }) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[120px]">
      <div
        role="status"
        aria-label="Loading"
        className={`
          ${sizeMap[size]}
          rounded-full
          border-primary-200
          border-t-primary-600
          animate-spin
        `}
      />
    </div>
  );
}
