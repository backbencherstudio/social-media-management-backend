import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // adjust the path if needed
import { AssignRoleByEmailDto } from './dto/AssignRoleByEmailDto';
import { CreateRoleDto } from './dto/create-role-dto';
import { ManageUserRoleDto } from './dto/mange-role-dto';

@Injectable()
export class UserAndRoleManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          role_users: {
            select: {
              role: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return users
        .filter(user => user.role_users.length > 0)
        .map(user => ({
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? '—',
          roles: user.role_users.map(r => r.role?.title ?? '_').join(', '),
          status: user.status === 1 ? 'Active' : 'Inactive',
          action: 'Manage',
        }));
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to fetch users');
    }
  }
  async assignRoleToUserByEmail(dto: AssignRoleByEmailDto) {
    try {
      const { email, roleId } = dto;

      const user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) throw new NotFoundException(`User with email "${email}" not found`);

      await this.prisma.roleUser.deleteMany({ where: { user_id: user.id } });

      await this.prisma.roleUser.create({
        data: {
          user_id: user.id,
          role_id: roleId,
        },
      });

      const updatedUser = await this.prisma.user.findUnique({
        where: { email: user.email },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          role_users: {
            select: {
              role: {
                select: {
                  id: true,
                  title: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        data: {
          ...updatedUser,
          role: updatedUser.role_users[0]?.role?.title ?? 'No Role',
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to assign role');
    }
  }
  async getRoles() {
    try {
      const roles = await this.prisma.role.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          title: true,
          name: true,
          status: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to fetch roles');
    }
  }
  async createRole(dto: CreateRoleDto) {
    try {
      const { title, name } = dto;

      const role = await this.prisma.role.create({
        data: {
          title,
          name,
        },
      });

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to create role');
    }
  }
  async deleteRole(id: string) {
    try {
      const role = await this.prisma.role.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      return {
        success: true,
        message: 'Role deleted successfully',
        data: role,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to delete role');
    }
  }
  async manageUserRole(dto: ManageUserRoleDto) {
    try {
      const { email, roleId, status } = dto;

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) throw new NotFoundException(`User with email "${email}" not found`);

      if (typeof status === 'number') {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status },
        });
      }

      if (roleId) {
        await this.prisma.roleUser.deleteMany({ where: { user_id: user.id } });

        await this.prisma.roleUser.create({
          data: {
            user_id: user.id,
            role_id: roleId,
          },
        });
      }

      const updated = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          email: true,
          status: true,
          role_users: {
            select: {
              role: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        data: {
          name: updated.name,
          email: updated.email,
          status: updated.status === 1 ? 'Active' : 'Inactive',
          role: updated.role_users[0]?.role?.title ?? 'No Role',
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to manage user role');
    }
  }
  
}
