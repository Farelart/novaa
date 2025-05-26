/* eslint-disable prettier/prettier */
export const AboutSettings = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 mx-auto max-w-md text-center">
      {/* Logo */}
      <div className="w-20 h-20 bg-red-500 transform rotate-45 rounded-lg flex items-center justify-center">
        <span className="transform -rotate-45 text-3xl font-bold text-white">n</span>
      </div>

      {/* App Info */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">novaa</h2>
        <div className="text-gray-400">
          <p>Version 1.0.0</p>
          <p>© novaa Technologies Ltd.</p>
          <p>2025. All Rights Reserved.</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-8">
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          Acknowledgements
        </button>
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          Visit Website
        </button>
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          Send Feedback
        </button>
      </div>
    </div>
  )
}
