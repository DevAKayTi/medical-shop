<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register a new user and assign a default role.
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'nullable|string|exists:roles,slug'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Assign role if provided, else default to 'cashier' (or adjust as needed)
        $roleSlug = $request->role ?? 'cashier';
        $role = Role::where('slug', $roleSlug)->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        $token = $user->createToken('AuthToken')->accessToken;

        return response()->json([
            'user' => $user->load('roles.permissions'),
            'token' => $token
        ], 201);
    }

    /**
     * User login.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = $request->user();
        $token = $user->createToken('AuthToken')->accessToken;

        ActivityLogger::log('Auth', 'Login', "User {$user->name} logged in.");

        return response()->json([
            'user' => $user->load('roles.permissions'),
            'token' => $token
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load('roles.permissions'));
    }

    /**
     * User logout (revoke token).
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        ActivityLogger::log('Auth', 'Logout', "User {$user->name} logged out.");
        $user->token()->revoke();
        return response()->json(['message' => 'Successfully logged out']);
    }
}
