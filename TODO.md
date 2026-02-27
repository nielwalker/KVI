# Task Plan: Announcement & Members Updates

## Requirements Analysis

1. **Calendar Announcements:**
   - Users can view announcement title in calendar day cells ✓
   - Users can click on day to view full announcement content ✓
   - Users can edit their own announcements only (if admin gives permission) ✓
   - Admin can edit any announcement ✓

2. **Sidebar Members Section:**
   - Remove toggle/permission controls in sidebar ✓
   - Make "Members" button navigate to /members page ✓

## Files Edited

### 1. src/pages/Calendar.jsx ✓
- Added edit state and modal for announcements
- Added edit button in detail modal (only for admin or own announcements with permission)
- Added edit form with title, content, priority, category fields
- Implemented update functionality for announcements
- Show edit button for: admin OR (author with canCreateAnnouncement permission)
- Added delete functionality for announcements

### 2. src/layout/Sidebar.jsx ✓
- Removed the permission toggles section for members
- Made "Members" button navigate to /members route
- Added click handler to navigate to Members page

## Status: COMPLETED ✓
