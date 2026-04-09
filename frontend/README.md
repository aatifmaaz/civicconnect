# Frontend - React Web Application

Next.js + React web interface for Civic Hub

## Overview

Modern, responsive web application with:
- Server-side rendering with Next.js
- Responsive Tailwind CSS design
- Real-time state management with Context API
- Chart.js visualizations
- Leaflet maps integration
- Three.js 3D visualization support
- Mobile-friendly interface

## Directory Structure

```
src/
├── pages/               # Next.js pages (routes)
│   ├── _app.js         # App wrapper
│   ├── _document.js    # HTML document
│   ├── index.js        # Home page
│   ├── register.js     # Citizen registration
│   ├── login.js        # Login page
│   ├── dashboard.js    # Citizen dashboard
│   ├── notifications.js # Notifications page
│   ├── complaint/
│   │   ├── submit.js   # Submit complaint
│   │   └── [id].js     # Complaint details
│   └── admin/
│       ├── dashboard.js # Admin dashboard
│       └── complaints.js # Manage complaints
├── components/          # Reusable components
│   ├── Layout.js
│   ├── Header.js
│   ├── Footer.js
│   ├── LoadingSpinner.js
│   ├── ComplaintCard.js
│   └── StatCard.js
├── services/           # API integration
│   └── api.js         # Axios instance & API calls
├── context/            # React Context
│   └── AuthContext.js  # Authentication state
├── styles/             # Stylesheets
│   └── globals.css    # Tailwind + global styles
└── utils/              # Helper functions
    └── helpers.js      # Utilities
```

## Features

### User Interface
- Clean, modern design
- Responsive mobile layout
- Fast page transitions
- Loading states
- Error handling
- Toast notifications

### Citizen Features
- Phone-based registration
- OTP verification
- Complaint submission
- Image upload
- GPS location capture
- Real-time status tracking
- Notification center
- Complaint history

### Admin Features
- Dashboard with statistics
- Chart.js visualizations
- Complaint management interface
- Status update modal
- Filter and search
- Pagination support

### Navigation
- Sticky header with user menu
- Mobile navigation menu
- Breadcrumb navigation
- Quick action buttons
- Links to all major pages

## Pages

### Public Pages
- `/` - Home page with features
- `/register` - Citizen registration (2-step with OTP)
- `/login` - Login page (Citizen/Admin tabs)

### Protected Pages (Citizen)
- `/dashboard` - My complaints & statistics
- `/complaint/submit` - Submit new complaint
- `/complaint/[id]` - Complaint details with history
- `/notifications` - Notification center

### Protected Pages (Admin)
- `/admin/dashboard` - Statistics & analytics
- `/admin/complaints` - Manage all complaints

## Components

### Layout
- `Layout` - Main wrapper with header/footer
- `Header` - Navigation bar
- `Footer` - Footer with links

### Utilities
- `LoadingSpinner` - Loading indicator
- `ComplaintCard` - Complaint list item
- `StatCard` - Statistics card

### Forms
- Registration form
- Login form
- Complaint submission form
- Status update modal

## Technologies

### Frontend Framework
- **Next.js 14** - React framework with SSR
- **React 18** - UI library
- **Tailwind CSS** - Styling

### UI/UX
- **Chart.js** - Data visualization
- **Leaflet** - Maps
- **React Toastify** - Notifications
- **Three.js** - 3D graphics (optional)

### HTTP Client
- **Axios** - API requests with interceptors

### State Management
- **React Context API** - Authentication state
- **localStorage** - Local data persistence

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Start development:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`

## Features Breakdown

### Authentication
- OTP-based citizen registration
- Email/password admin login
- JWT token storage
- Automatic logout on token expiry
- Protected route access

### Complaint Management
- Submit with title, description, category
- GPS location capture or manual entry
- Image upload with preview
- Real-time status updates
- Complete activity history

### Notifications
- Status change alerts
- Assignment notifications
- Mark as read
- Unread count badge
- Notification history

### Dashboard
- Complaint statistics (Total, Pending, In Progress, Resolved)
- Quick complaint card view
- Pagination support
- Status filtering
- One-click complaint view

### Admin Panel
- Key metrics display
- Chart.js bar charts
- Status distribution visualization
- Category breakdown
- Complaint data table
- Inline status update
- Date range statistics

## API Integration

Uses centralized API service:
```javascript
// Authentication
authAPI.register(data)
authAPI.verifyOTP(data)
authAPI.adminLogin(data)
authAPI.getProfile()

// Complaints
complaintAPI.create(data)
complaintAPI.getMyComplaints(page, limit)
complaintAPI.getById(id)
complaintAPI.updateStatus(id, data)
complaintAPI.search(filters)

// Notifications
notificationAPI.getAll(page, limit)
notificationAPI.markAsRead(id)
notificationAPI.markAllAsRead()
notificationAPI.getUnreadCount()

// Admin
adminAPI.getDashboard()
adminAPI.getAllComplaints(page, limit)
adminAPI.assignComplaint(id, data)
adminAPI.getStats(startDate, endDate)
```

## Styling

### Tailwind CSS
- Utility-first approach
- Responsive breakpoints
- Dark mode ready
- Custom color scheme

### Global Classes
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Card container
- `.input-field` - Form input
- `.badge` - Status badge

## Responsive Design

- Mobile-first approach
- Breakpoints: sm, md, lg
- Touch-friendly buttons
- Optimized layouts
- Mobile menu toggle

## Performance

- Next.js automatic code splitting
- Image optimization ready
- Static generation for pages
- Client-side caching
- Lazy loading components

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_ENV=development
```

## Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
```bash
vercel deploy
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Accessibility

- Semantic HTML
- ARIA labels ready
- Keyboard navigation
- Color contrast
- Alt text for images

## SEO

- Next.js built-in SEO
- Meta tags per page
- Canonical URLs ready
- Open Graph ready
- Structured data ready

## Internalization (i18n)

Ready for implementation:
- Multi-language support
- Language switching
- RTL support

## Future Enhancements

- [ ] Three.js 3D dashboard
- [ ] Dark mode toggle
- [ ] Advanced filtering
- [ ] Export/PDF reports
- [ ] Real-time WebSocket updates
- [ ] Offline support (PWA)
- [ ] Multi-language support
- [ ] Advanced search
- [ ] Mobile app (React Native)

## Code Quality

- Clean, readable code
- Component reusability
- Proper error handling
- Loading states
- User feedback
- Browser compatibility

## Testing

Ready for:
- Jest unit tests
- Cypress E2E tests
- React Testing Library

## Debugging

### Local Storage
- `authToken` - JWT token
- `userId` - User ID
- `userRole` - User role

### Console Logs
- API requests logged
- Errors logged
- Debug info available

## Troubleshooting

### Login Issues
- Check token in localStorage
- Verify API URL
- Check browser console

### API Errors
- Check backend is running
- Verify `.env.local`
- Check API documentation

### UI Issues
- Clear browser cache
- Check Tailwind CSS loaded
- Verify responsive design

## License

Civic Hub Frontend - Production Ready

## Support

For issues, check:
1. docs/SETUP.md for setup help
2. docs/API.md for API details
3. Browser console for errors
