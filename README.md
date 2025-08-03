# Accomplo - Personal Accomplishment Tracker

A beautiful, modern web application for tracking your personal accomplishments and achievements.

## Features

- 🎯 **Track Accomplishments** - Record your achievements by category and time period
- 🔐 **Secure Authentication** - Email/password authentication with password reset
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🎨 **Modern UI** - Beautiful design with smooth animations and transitions
- ☁️ **Cloud Database** - Powered by Supabase for reliable data storage

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

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/accomplo.git
cd accomplo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:8080](http://localhost:8080) in your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   └── ProtectedRoute.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── use-toast.ts    # Toast notifications
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── pages/              # Page components
│   ├── Auth.tsx        # Authentication page
│   ├── Index.tsx       # Main dashboard
│   └── NotFound.tsx    # 404 page
├── lib/                # Utility functions
└── styles/             # Global styles
```

## Features in Detail

### Authentication
- Email/password sign up and sign in
- Password reset via email
- Protected routes
- Automatic session management

### Accomplishment Tracking
- Create accomplishments by category
- Organize by month/year
- Rich text content support
- Personal dashboard view

### Design System
- Consistent color palette with CSS custom properties
- Responsive breakpoints
- Smooth animations and transitions
- Glass morphism effects
- Dark theme optimized

## Database Schema

The application uses Supabase with the following main tables:

- `profiles` - User profile information
- `accomplishments` - User accomplishments and achievements

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch.


## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Supabase.
