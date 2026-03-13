<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-users', only: ['index', 'show']),
            new Middleware('can:create-users', only: ['store']),
            new Middleware('can:update-users', only: ['update', 'syncRoles']),
            new Middleware('can:delete-users', only: ['destroy']),
        ];
    }
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $shopId = Auth::user()->shop_id;
        $users = User::with('roles')
            ->where('shop_id', $shopId)
            ->get();
        return response()->json($users);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'is_active' => 'boolean',
            'role' => 'required|string|exists:roles,slug'
        ]);

        $user = User::create([
            'shop_id'    => Auth::user()->shop_id,
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'phone'      => $validated['phone'] ?? null,
            'password'   => Hash::make($validated['password']),
            'is_active'  => $request->boolean('is_active', true),
        ]);

        $role = Role::where('slug', $validated['role'])->first();
        if ($role) {
            $user->roles()->sync([$role->id]);
        }

        return response()->json($user->load('roles'), 201);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user)
    {
        return response()->json($user->load('roles.permissions'));
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'sometimes|string|min:8|confirmed',
            'is_active' => 'boolean',
            'role' => 'nullable|string|exists:roles,slug'
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        if (isset($validated['role'])) {
            $role = Role::where('slug', $validated['role'])->first();
            if ($role) {
                $user->roles()->sync([$role->id]);
            } else {
                $user->roles()->detach();
            }
        }

        return response()->json($user->load('roles'));
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Sync roles for a specific user.
     */
    public function syncRoles(Request $request, User $user)
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id',
        ]);

        $user->roles()->sync($validated['roles']);

        return response()->json($user->load('roles'));
    }
}
