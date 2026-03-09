<?php

namespace App\Traits;

use App\Models\Role;
use App\Models\Permission;
use App\Models\UserRole;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

trait HasRoles
{
    /**
     * Users can have many roles.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'platform_user_id', 'role_id')
                    ->using(UserRole::class);
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $roleSlug): bool
    {
        return $this->roles->contains('slug', $roleSlug);
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roleSlugs): bool
    {
        return $this->roles->whereIn('slug', $roleSlugs)->isNotEmpty();
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->roles->flatMap->permissions->contains('slug', $permissionSlug);
    }
}
