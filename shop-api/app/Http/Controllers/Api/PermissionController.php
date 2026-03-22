<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PermissionController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-roles', only: ['index', 'show']),
            new Middleware('can:manage-roles', only: ['store', 'update', 'destroy']),
        ];
    }
    public function index()
    {
        return response()->json(Permission::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name',
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $permission = Permission::create($validated);

        ActivityLogger::log('Permissions', 'Create Permission', "Created permission: {$permission->name}");

        return response()->json($permission, 201);
    }

    public function show(Permission $permission)
    {
        return response()->json($permission);
    }

    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:permissions,name,' . $permission->id,
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $permission->update($validated);

        ActivityLogger::log('Permissions', 'Update Permission', "Updated permission: {$permission->name}");

        return response()->json($permission);
    }

    public function destroy(Permission $permission)
    {
        $name = $permission->name;
        $permission->delete();
        ActivityLogger::log('Permissions', 'Delete Permission', "Deleted permission: {$name}");
        return response()->json(null, 204);
    }
}
