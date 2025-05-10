import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserAndRoleManagementService } from './user_and_role_management.service';
import { AssignRoleByEmailDto } from './dto/AssignRoleByEmailDto';
import { CreateRoleDto } from './dto/create-role-dto';
import { ManageUserRoleDto } from './dto/mange-role-dto';


@Controller('user-and-role-management')
export class UserAndRoleManagementController {
  constructor(private readonly userAndRoleManagementService: UserAndRoleManagementService) {}
  @Get()
  async getAllUsers() {
    try {
      const users = await this.userAndRoleManagementService.getAllUsers();
      return {
        success: true,
        message: 'Users fetched successfully',
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch users',
      };
    }
  }

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    try {
      const role = await this.userAndRoleManagementService.createRole(dto);
      return {
        success: true,
        message: 'Role created successfully',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create role',
      };
    }
  }

  @Patch('assign-role')
  async assignRole(@Body() dto: AssignRoleByEmailDto) {
    try {
      const result = await this.userAndRoleManagementService.assignRoleToUserByEmail(dto);
      return {
        success: true,
        message: 'Role assigned successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to assign role',
      };
    }
  }

  @Get('roles')
  async getRoles() {
    try {
      const roles = await this.userAndRoleManagementService.getRoles();
      return {
        success: true,
        message: 'Roles fetched successfully',
        data: roles,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch roles',
      };
    }
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    try {
      const result = await this.userAndRoleManagementService.deleteRole(id);
      return {
        success: true,
        message: 'Role deleted successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete role',
      };
    }
  }

  @Patch('manage-role')
  async manageUserRole(@Body() dto: ManageUserRoleDto) {
    try {
      const result = await this.userAndRoleManagementService.manageUserRole(dto);
      return {
        success: true,
        message: 'User role updated successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to manage user role',
      };
    }
  }


}
