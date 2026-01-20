import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import api from '../services/api'
import { format } from 'date-fns'

const NotificationBell = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  const userRole = localStorage.getItem('userRole')
  const isHrAdmin = userRole === 'HR_ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  const isEmployee = userRole === 'EMPLOYEE' || userRole === 'MANAGER' || userRole === 'FINANCE'

  // Show for HR_ADMIN, SUPER_ADMIN, and employees (EMPLOYEE, MANAGER, FINANCE)
  if (!isHrAdmin && !isSuperAdmin && !isEmployee) {
    return null
  }

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount()
      if (showDropdown) {
        loadNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [showDropdown])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.getUnreadNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationCount()
      setUnreadCount(data?.count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
      setUnreadCount(0)
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      // Mark only this notification as read (not all)
      await api.markNotificationAsRead(notification.id)
      await loadNotifications()
      await loadUnreadCount()
      
      // Navigate based on notification type
      if (notification.relatedType === 'LEAVE' && notification.relatedId) {
        // For employees, navigate to leave page (My Leaves), for admins navigate to leave management
        if (isEmployee) {
          // Store leave ID in sessionStorage and navigate to leave page
          sessionStorage.setItem('viewLeaveId', notification.relatedId.toString())
          navigate('/leave?leaveId=' + notification.relatedId)
        } else {
          // For HR_ADMIN and SUPER_ADMIN, navigate to leave management
          sessionStorage.setItem('viewLeaveId', notification.relatedId.toString())
          navigate('/leave?leaveId=' + notification.relatedId)
        }
        setShowDropdown(false)
      } else if (notification.relatedType === 'HR_TICKET' && notification.relatedId) {
        // Navigate to HR tickets page
        navigate('/tickets')
        setShowDropdown(false)
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId)
      await loadNotifications()
      await loadUnreadCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead()
      await loadNotifications()
      await loadUnreadCount()
      // Don't clear notifications from state - they'll be filtered out by getUnreadNotifications
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      loadNotifications()
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleCloseDropdown = () => {
    setShowDropdown(false)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED':
        return '📅'
      case 'HR_TICKET_CREATED':
        return '🎫'
      case 'LEAVE_APPROVED':
        return '✅'
      case 'LEAVE_REJECTED':
        return '❌'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED':
        return 'bg-blue-100 text-blue-800'
      case 'HR_TICKET_CREATED':
        return 'bg-orange-100 text-orange-800'
      case 'LEAVE_APPROVED':
        return 'bg-green-100 text-green-800'
      case 'LEAVE_REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseDropdown}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No new notifications</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell

