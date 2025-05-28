/* eslint-disable prettier/prettier */
import { DraggableSettingsTopBar } from '@renderer/components/DraggableSettingsTopBar'
import { AiOutlineSetting } from 'react-icons/ai'
import { BsPerson, BsRobot } from 'react-icons/bs'
import { FiInfo } from 'react-icons/fi'
import { VscExtensions } from 'react-icons/vsc'
import { NavLink, Outlet } from 'react-router-dom' // Import NavLink and Outlet

type TabButtonProps = {
  icon: React.ReactNode
  label: string
  isPro?: boolean
  to: string
}

export const Settings = () => {
  return (
    <div className="relative min-h-screen rounded-[10px] overflow-hidden bg-[rgba(0,0,0,0.7)] border border-[rgba(255,255,255,0.28)]">
      <DraggableSettingsTopBar />

      <div className="absolute top-8 left-0 right-0 mt-2 flex items-center justify-center space-x-8 px-4">
        <TabButtonLink to="general" icon={<AiOutlineSetting />} label="General" />
        <TabButtonLink to="extensions" icon={<VscExtensions />} label="Mates" />
        <TabButtonLink to="ai" icon={<BsRobot />} label="AI" isPro />
        <TabButtonLink to="account" icon={<BsPerson />} label="Account" />
        <TabButtonLink to="about" icon={<FiInfo />} label="About" />
      </div>
      <div className="absolute top-[120px] left-0 right-0 bottom-0 overflow-y-auto px-8">
        <Outlet />
      </div>
    </div>
  )
}

const TabButtonLink = ({ icon, label, isPro = false, to }: TabButtonProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors 
        ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
      }
    >
      <div className="relative">
        {icon}
        {isPro && (
          <span className="absolute -top-1 -right-1 text-[8px] font-semibold bg-red-500 text-white px-1 rounded">
            PRO
          </span>
        )}
      </div>
      <span className="text-xs text-white/80">{label}</span>
    </NavLink>
  )
}
