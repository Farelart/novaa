/* eslint-disable prettier/prettier */
export const AccountSettings = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold">Account Settings</h2>
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-medium">Profile</h3>
        <div className="mt-4 space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-white/10 rounded px-3 py-2"
          />
          <input
            type="password"
            placeholder="Current Password"
            className="w-full bg-white/10 rounded px-3 py-2"
          />
        </div>
      </div>
    </div>
  </div>
)
