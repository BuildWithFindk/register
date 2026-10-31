# E-commerce register + login

React pages (your identifier-first login + a matching register page) talking to a Laravel + Sanctum API that stores customers in PostgreSQL.

## 1. Backend (Laravel 11/12)

```bash
php artisan install:api            # installs Sanctum, creates routes/api.php
```

`.env`
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=store
DB_USERNAME=postgres
DB_PASSWORD=secret
FRONTEND_URL=http://localhost:3000
```

1. Copy `backend/AuthController.php` to `app/Http/Controllers/` and `backend/api.php` to `routes/api.php`.
2. In `app/Models/User.php`: `use Laravel\Sanctum\HasApiTokens;` and add `HasApiTokens` to the class's `use` line.
3. `php artisan config:publish cors`, then in `config/cors.php`:
   `'paths' => ['api/*'], 'allowed_origins' => [env('FRONTEND_URL')],`
4. In `config/sanctum.php`: `'expiration' => 60 * 24 * 7,` (tokens last 7 days).
5. `php artisan migrate && php artisan serve`

The default `users` migration (name, email, password) is the data store. Add e-commerce columns (phone, address) with your own migration.

## 2. Frontend (React / Next.js)

Needs `lucide-react` and shadcn-style tokens (`bg-card`, `border-border`, `text-destructive`, ...).

Save your component as `auth/IdentifierFirstLogin.tsx` (unchanged), then add `auth.tsx` and `pages.tsx` beside it.

`.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

```tsx
// app/layout.tsx
import { AuthProvider } from "@/auth/auth";
// ...wrap {children}:
<AuthProvider baseUrl={process.env.NEXT_PUBLIC_API_URL!}>{children}</AuthProvider>

// app/login/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { LoginPage } from "@/auth/pages";
export default function Page() {
  const router = useRouter();
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <LoginPage appName="Your Store" onSuccess={() => router.push("/account")} onRegister={() => router.push("/register")} />
    </main>
  );
}
// app/register/page.tsx is the same with <RegisterPage onSuccess=... onLogin={() => router.push("/login")} />
```

Anywhere else: `const { user, loading, logout } = useAuth();` for navbars, checkout guards, and account pages.

## 3. Using a different backend

Keep the contract at the top of `auth.tsx` (`/register`, `/login`, `/me`, `/logout`, 422 `errors` shape) and nothing in the UI changes. Express, Django, or Supabase behind a thin API all fit.

## Notes

- **Token storage:** the token lives in `localStorage`, which is simple and works across domains but is readable by any XSS. For a higher bar, switch to Sanctum's cookie mode (same top-level domain) and drop the `Authorization` header.
- **Register reveals whether an email exists** (the `unique` rule). That's the normal trade-off for sign-up; login does not reveal it.
- **Social buttons** in your component are shown but inactive until you pass `onSocial` (e.g. Laravel Socialite redirect).
- **Admin:** `php artisan make:filament-resource User` gives you a customer list in Filament.
