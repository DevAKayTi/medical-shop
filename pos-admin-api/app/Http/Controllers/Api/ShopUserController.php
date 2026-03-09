<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShopUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ShopUserController extends Controller
{
    /**
     * List all shop users from shop_db. 
     * Includes their shop name and role.
     */
    public function index(Request $request)
    {
        $query = ShopUser::with('shop:id,name');

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->shop_id);
        }

        if ($request->filled('status')) {
            $isActive = $request->status === 'active' ? 1 : 0;
            $query->where('is_active', $isActive);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        // Attach roles manually since roles are in shop_db but managed complexly
        $userIds = collect($users->items())->pluck('id')->toArray();
        if (!empty($userIds)) {
            $roles = DB::connection('pos_db')
                ->table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->whereIn('user_roles.platform_user_id', $userIds)
                ->select('user_roles.platform_user_id', 'roles.name', 'roles.slug')
                ->get()
                ->groupBy('platform_user_id');

            foreach ($users->items() as $user) {
                $userRole = $roles->get($user->id)?->first();
                $user->role = $userRole ? ['name' => $userRole->name, 'slug' => $userRole->slug] : null;
            }
        }

        return response()->json($users);
    }

    /**
     * Create a new shop user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_id'   => 'required|exists:pos_db.shops,id',
            'name'      => 'required|string|max:191',
            'email'     => 'required|email|max:191|unique:pos_db.users,email',
            'password'  => 'required|string|min:8',
            'role_slug' => 'required|string|exists:pos_db.roles,slug',
        ]);

        DB::connection('pos_db')->beginTransaction();

        try {
            $user = ShopUser::create([
                'shop_id'  => $validated['shop_id'],
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => bcrypt($validated['password']),
                'is_active' => true,
            ]);

            $role = DB::connection('pos_db')
                ->table('roles')
                ->where('slug', $validated['role_slug'])
                ->first();

            DB::connection('pos_db')->table('user_roles')->insert([
                'id'               => Str::uuid(),
                'platform_user_id' => $user->id,
                'role_id'          => $role->id,
                'created_at'       => now(),
            ]);

            DB::connection('pos_db')->commit();

            return response()->json([
                'message' => 'Shop user created successfully.',
                'user'    => $user,
            ], 201);

        } catch (\Exception $e) {
            DB::connection('pos_db')->rollBack();
            return response()->json(['message' => 'Failed to create user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Suspend/Activate a shop user.
     */
    public function toggleStatus(Request $request, string $id)
    {
        $user = ShopUser::findOrFail($id);
        
        $validated = $request->validate([
            'is_active' => 'required|boolean'
        ]);

        $user->update(['is_active' => $validated['is_active']]);

        return response()->json([
            'message' => $validated['is_active'] ? 'User hidden successfully.' : 'User suspended successfully.',
            'user'    => $user,
        ]);
    }
    /**
     * Show a single shop user.
     */
    public function show(string $id)
    {
        $user = ShopUser::with('shop:id,name')->findOrFail($id);

        $role = DB::connection('pos_db')
            ->table('user_roles')
            ->join('roles', 'user_roles.role_id', '=', 'roles.id')
            ->where('user_roles.platform_user_id', $id)
            ->select('roles.name', 'roles.slug')
            ->first();

        $user->role = $role ? ['name' => $role->name, 'slug' => $role->slug] : null;

        return response()->json($user);
    }

    /**
     * Update a shop user.
     */
    public function update(Request $request, string $id)
    {
        $user = ShopUser::findOrFail($id);

        $validated = $request->validate([
            'shop_id'   => 'sometimes|required|exists:pos_db.shops,id',
            'name'      => 'sometimes|required|string|max:191',
            'email'     => 'sometimes|required|email|max:191|unique:pos_db.users,email,' . $id,
            'role_slug' => 'sometimes|required|string|exists:pos_db.roles,slug',
            'is_active' => 'sometimes|boolean',
        ]);

        DB::connection('pos_db')->beginTransaction();

        try {
            // Update user details
            $userData = collect($validated)->except('role_slug')->toArray();
            if (!empty($userData)) {
                $user->update($userData);
            }

            // Update role if provided
            if (isset($validated['role_slug'])) {
                $role = DB::connection('pos_db')
                    ->table('roles')
                    ->where('slug', $validated['role_slug'])
                    ->first();

                if ($role) {
                    DB::connection('pos_db')
                        ->table('user_roles')
                        ->where('platform_user_id', $user->id)
                        ->update(['role_id' => $role->id]);
                }
            }

            DB::connection('pos_db')->commit();

            return response()->json([
                'message' => 'Shop user updated successfully.',
                'user'    => $user,
            ]);

        } catch (\Exception $e) {
            DB::connection('pos_db')->rollBack();
            return response()->json(['message' => 'Failed to update user: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a shop user.
     */
    public function destroy(string $id)
    {
        $user = ShopUser::findOrFail($id);
        
        DB::connection('pos_db')->beginTransaction();
        try {
            // Remove roles first
            DB::connection('pos_db')->table('user_roles')->where('platform_user_id', $user->id)->delete();
            
            $user->delete();
            
            DB::connection('pos_db')->commit();
            return response()->json(['message' => 'Shop user deleted successfully.']);
        } catch (\Exception $e) {
            DB::connection('pos_db')->rollBack();
            return response()->json(['message' => 'Failed to delete user: ' . $e->getMessage()], 500);
        }
    }
}
