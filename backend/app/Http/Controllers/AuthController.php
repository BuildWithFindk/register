<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $this->normalizeEmail($request);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // The User model's 'hashed' cast bcrypts the password.
        return $this->issueToken(User::create($data), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $this->normalizeEmail($request);

        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Same message for unknown email and wrong password: no account enumeration.
        if (! Auth::validate($credentials)) {
            return response()->json(['message' => 'Incorrect email or password.'], 401);
        }

        return $this->issueToken(User::where('email', $credentials['email'])->firstOrFail());
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->present($request->user())]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    private function issueToken(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'user'  => $this->present($user),
            'token' => $user->createToken('web')->plainTextToken,
        ], $status);
    }

    private function present(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    }

    // PostgreSQL unique indexes are case-sensitive, so store emails lowercased.
    private function normalizeEmail(Request $request): void
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
    }
}
