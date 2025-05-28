/* eslint-disable prettier/prettier */
import { Switch } from '@headlessui/react'
import { useState } from 'react'
import { AiOutlineYoutube } from 'react-icons/ai'
import { BsFolder, BsWhatsapp } from 'react-icons/bs'
import { FiSearch } from 'react-icons/fi'
import {
  SiDropbox,
  SiGmail,
  SiGoogledrive,
  SiHubspot,
  SiMicrosoftoutlook,
  SiNotion,
  SiSlack
} from 'react-icons/si'

interface Extension {
  name: string
  icon: React.ReactNode
  available: string
  enabled: boolean
}

export const ExtensionsSettings = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [extensions] = useState<Extension[]>([
    {
      name: 'Filesystem',
      icon: <BsFolder className="w-5 h-5" />,
      available: 'Yes',
      enabled: true
    },
    {
      name: 'Gmail',
      icon: <SiGmail className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'YouTube',
      icon: <AiOutlineYoutube className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'Notion',
      icon: <SiNotion className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'HubSpot',
      icon: <SiHubspot className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'WhatsApp',
      icon: <BsWhatsapp className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },

    {
      name: 'Outlook',
      icon: <SiMicrosoftoutlook className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'Dropbox',
      icon: <SiDropbox className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'Google Drive',
      icon: <SiGoogledrive className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    },
    {
      name: 'Slack',
      icon: <SiSlack className="w-5 h-5" />,
      available: 'Coming Soon',
      enabled: false
    }
  ])

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search mates..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white/80 placeholder-white/40 focus:outline-none focus:border-white/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Extensions Table */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white/5">
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 px-4 text-sm font-medium text-white/60">Name</th>
                <th className="py-3 px-4 text-sm font-medium text-white/60">Available</th>
                <th className="py-3 px-4 text-sm font-medium text-white/60">Enable</th>
              </tr>
            </thead>
            <tbody>
              {extensions
                .filter((ext) => ext.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((extension, index) => (
                  <tr key={index} className="border-b border-white/10 last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-white/60">{extension.icon}</span>
                        <span className="text-white/80">{extension.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm ${extension.available === 'Yes' ? 'text-green-400' : 'text-white/40'}`}
                      >
                        {extension.available}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Switch
                        checked={extension.enabled}
                        onChange={() => {}}
                        disabled={extension.available !== 'Yes'}
                        className={`${extension.enabled ? 'bg-blue-600' : 'bg-white/10'}
                          relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out
                          ${extension.available !== 'Yes' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`${extension.enabled ? 'translate-x-5' : 'translate-x-1'}
                            pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                            mt-1`}
                        />
                      </Switch>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
