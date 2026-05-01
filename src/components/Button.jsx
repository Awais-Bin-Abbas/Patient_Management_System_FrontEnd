const Button = ({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  loading = false, disabled = false,
  fullWidth = false, icon = null,
}) => {
  const variants = {
    primary:   'bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger:    'bg-red-500 text-white hover:bg-red-600',
    success:   'bg-teal-600 text-white hover:bg-teal-700',
    outline:   'border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white',
    ghost:     'text-blue-700 hover:bg-blue-50',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : icon}
      {children}
    </button>
  )
}

export default Button