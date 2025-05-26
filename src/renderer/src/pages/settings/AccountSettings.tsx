/* eslint-disable prettier/prettier */
export const AccountSettings = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-6 mx-auto max-w-md text-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Logo */}
        <div className="w-16 h-16 bg-red-500 transform rotate-45 rounded-lg flex items-center justify-center">
          <span className="transform -rotate-45 text-2xl font-bold text-white">n</span>
        </div>

        {/* Title and Description */}
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <p className="text-gray-400 text-center">
          You need to log in or create an account to view
          <br />
          your organizations, manage your custom
          <br />
          extensions, and upgrade to Pro.
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-6">
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            Sign Up
          </button>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            Log In
          </button>
        </div>
      </div>
    </div>
  )
}
