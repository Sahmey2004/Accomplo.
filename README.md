# Accomplo - Personal Accomplishment Tracker

A beautiful, modern web application for tracking your personal accomplishments and achievements.

## Features

-  **Track Accomplishments** - Record your achievements by category and time period
-  **Secure Authentication** - Email/password authentication with password reset
-  **Responsive Design** - Works perfectly on desktop and mobile devices
-  **Modern UI** - Beautiful design with smooth animations and transitions
-  **Cloud Database** - Powered by Supabase for reliable data storage

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Deployment**: Vercel
- **State Management**: React Query (TanStack Query)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn


## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   └── ProtectedRoute.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── use-toast.ts    
├── integrations/       
│   └── supabase/       
├── pages/              # Page components
│   ├── Auth.tsx        # Authentication page
│   ├── Index.tsx       # Main dashboard
│   └── NotFound.tsx    # 404 page
├── lib/                
└── styles/             
```


## Database Schema

The application uses Supabase with the following main tables:

- `profiles` - User profile information
- `accomplishments` - User accomplishments and achievements

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch.



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub.

---

Built using React, TypeScript, and Supabase.
