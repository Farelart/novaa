/* eslint-disable prettier/prettier */
export const AISettings = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold">AI Settings</h2>
    <div className="space-y-4">
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-medium">API Configuration</h3>
        <input
          type="text"
          placeholder="Enter API Key"
          className="mt-2 w-full bg-white/10 rounded px-3 py-2"
        />
      </div>
      <div className="bg-white/5 p-4 rounded-lg">
        <h3 className="font-medium">Model Selection</h3>
        <select className="mt-2 w-full bg-white/10 rounded px-3 py-2">
          <option>GPT-4</option>
          <option>GPT-3.5</option>
        </select>
      </div>
    </div>
  </div>
)
