// external imports
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
//internal imports
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../common/repository/user/user.repository';
import { MailService } from '../../mail/mail.service';
import { UcodeRepository } from '../../common/repository/ucode/ucode.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import appConfig from '../../config/app.config';
import { SojebStorage } from '../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../common/helper/date.helper';
import { StripePayment } from 'src/common/lib/Payment/stripe/StripePayment';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async me(userId: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          address: true,
          phone_number: true,
          type: true,
          gender: true,
          date_of_birth: true,
          created_at: true,
        },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.avatar) {
        user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + user.avatar,
        );
      }

      if (user) {
        return {
          success: true,
          data: user,
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // find all
  async findAllUsers() {
    try {
      const users = await UserRepository.getAllUsers();

      return {
        success: true,
        message: 'Users fetched successfully',
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  //find all admins
  async findAllAdmins(p0: { q: string; type: string; approved: string }) {
    try {
      const users = await UserRepository.getAllAdmins();

      return {
        success: true,
        message: 'Users fetched successfully',
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  //find all admins
  async findAllClints(p0: { q: string; type: string; approved: string }) {
    try {
      const users = await UserRepository.getAllClints();

      return {
        success: true,
        message: 'Clints fetched successfully',
        data: users,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  //find all admins
  async findAllResellers(p0: { q: string; type: string; approved: string }) {
    try {
      const users = await UserRepository.getAllResellers();

      return {
        success: true,
        message: 'Resellers fetched successfully',
        data: users
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  //update a user
  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    image?: Express.Multer.File,
  ) {
    try {
      // First verify the user exists
      const user = await UserRepository.getUserDetails(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const data: any = {};
      if (updateUserDto.name) {
        data.name = updateUserDto.name;
      }
      if (updateUserDto.first_name) {
        data.first_name = updateUserDto.first_name;
      }
      if (updateUserDto.last_name) {
        data.last_name = updateUserDto.last_name;
      }
      if (updateUserDto.phone_number) {
        data.phone_number = updateUserDto.phone_number;
      }
      if (updateUserDto.country) {
        data.country = updateUserDto.country;
      }
      if (updateUserDto.state) {
        data.state = updateUserDto.state;
      }
      if (updateUserDto.city) {
        data.city = updateUserDto.city;
      }
      if (updateUserDto.zip_code) {
        data.zip_code = updateUserDto.zip_code;
      }
      if (updateUserDto.address) {
        data.address = updateUserDto.address;
      }
      if (updateUserDto.gender) {
        data.gender = updateUserDto.gender;
      }
      if (updateUserDto.date_of_birth) {
        data.date_of_birth = DateHelper.format(updateUserDto.date_of_birth);
      }
      // New fields
      if (updateUserDto.location) {
        data.location = updateUserDto.location;
      }
      if (updateUserDto.position) {
        data.position = updateUserDto.position;
      }
      if (updateUserDto.experience_year) {
        data.experience_year = updateUserDto.experience_year;
      }
      if (updateUserDto.portfolio_url) {
        data.portfolio_url = updateUserDto.portfolio_url;
      }
      if (updateUserDto.skills) {
        data.skills = updateUserDto.skills;
      }
      if (updateUserDto.cover_letter) {
        data.cover_letter = updateUserDto.cover_letter;
      }
      if (updateUserDto.agreed_terms) {
        data.agreed_terms = updateUserDto.agreed_terms;
      }
      if (image) {
        const oldImage = await this.prisma.user.findFirst({
          where: { id: userId },
          select: { avatar: true },
        });
        if (oldImage.avatar) {
          await SojebStorage.delete(
            appConfig().storageUrl.avatar + oldImage.avatar,
          );
        }

        // upload image
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');

        const fileName = `${randomName}${image.originalname}`;
        await SojebStorage.put(
          appConfig().storageUrl.avatar + '/' + fileName,
          image.buffer,
        );

        data.avatar = fileName;
      }

      // Update user with correct where clause
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: data,
      });

      if (updatedUser.avatar) {
        updatedUser['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + updatedUser.avatar,
        );
      }

      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // find only one admin
  async validateUser(
    email: string,
    pass: string,
    token?: string,
  ): Promise<any> {
    const _password = pass;
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      const _isValidPassword = await UserRepository.validatePassword({
        email: email,
        password: _password,
      });
      if (_isValidPassword) {
        const { password, ...result } = user;
        if (user.is_two_factor_enabled) {
          if (token) {
            const isValid = await UserRepository.verify2FA(user.id, token);
            if (!isValid) {
              throw new UnauthorizedException('Invalid token');
              // return {
              //   success: false,
              //   message: 'Invalid token',
              // };
            }
          } else {
            throw new UnauthorizedException('Token is required');
            // return {
            //   success: false,
            //   message: 'Token is required',
            // };
          }
        }
        return result;
      } else {
        throw new UnauthorizedException('Password not matched');
        // return {
        //   success: false,
        //   message: 'Password not matched',
        // };
      }
    } else {
      throw new UnauthorizedException('Email not found');
      // return {
      //   success: false,
      //   message: 'Email not found',
      // };
    }
  }

  async login({ email, userId }) {
    try {
      const payload = { email: email, sub: userId };
      const token = this.jwtService.sign(payload);
      const user = await UserRepository.getUserDetails(userId);

      return {
        success: true,
        message: 'Logged in successfully',
        authorization: {
          token: token,
          type: 'bearer',
        },
        type: user.type,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async register({ email }: { email: string }) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      console.log('existingUser: ', existingUser);

      if (existingUser?.password) {
        return {
          success: false,
          message: 'redirect to login page',
        };
      }

      const token = this.jwtService.sign(
        { email },
        {
          expiresIn: '24h',
        },
      );

      // Send verification email with full URL
      const verificationLink = `${process.env.APP_URL}/api/auth/verify-registration?token=${token}`;

      this.mailService.sendVerificationLink({
        email,
        link: verificationLink,
        name: email,
      });

      return {
        success: true,
        message: 'Registration link sent to email',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async verifyRegistrationToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const { email } = decoded;
  
      console.log('decoded: ', decoded);
  
      // 🔍 Step 1: Check if the user already exists BEFORE upsert
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
  
  
      const user = await this.prisma.user.upsert({
        where: {
          email,
        },
        update: {
          status: 1,
        },
        create: {
          email,
          status: 1,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone_number: true,
          location: true,
          position: true,
          experience_year: true,
          portfolio_url: true,
          skills: true,
          cover_letter: true,
          agreed_terms: true,
          avatar: true,
        },
      });
  

      if (!existingUser) {
        
        const stripeCustomer = await StripePayment.createCustomer({
          user_id: user.id,
          email: email,
          name: null,
        });
        console.log("stripeCustomer", stripeCustomer)
        if (stripeCustomer) {
          await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              billing_id: stripeCustomer.id,
            },
          });
        }
      }
  
      console.log('user: ', user);
  
      // 🔑 Step 4: Generate access token
      const accessToken = this.jwtService.sign({
        userId: user.id,
        email: user.email,
      });
  
      return {
        success: true,
        message: 'Registration successful',
        data: {
          accessToken,
          user,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Invalid or expired token',
      };
    }
  }
  

  //forget passs
  async forgotPassword(email) {
    try {
      const user = await UserRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const token = await UcodeRepository.createToken({
          userId: user.id,
          isOtp: true,
        });

        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: user.name,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent an OTP code to your email',
        };
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async resetPassword({ email, token, password }) {
    try {
      const user = await UserRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const existToken = await UcodeRepository.validateToken({
          email: email,
          token: token,
        });

        if (existToken) {
          await UserRepository.changePassword({
            email: email,
            password: password,
          });

          // delete otp code
          await UcodeRepository.deleteToken({
            email: email,
            token: token,
          });

          return {
            success: true,
            message: 'Password updated successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async verifyEmail({ email, token }) {
    try {
      const user = await UserRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const existToken = await UcodeRepository.validateToken({
          email: email,
          token: token,
        });

        if (existToken) {
          await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              email_verified_at: new Date(Date.now()),
            },
          });

          // delete otp code
          // await UcodeRepository.deleteToken({
          //   email: email,
          //   token: token,
          // });

          return {
            success: true,
            message: 'Email verified successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      const user = await UserRepository.getUserByEmail(email);

      if (user) {
        // create otp code
        const token = await UcodeRepository.createToken({
          userId: user.id,
          isOtp: true,
        });

        // send otp code to email
        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: user.name,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent a verification code to your email',
        };
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async changePassword({ user_id, oldPassword, newPassword }) {
    try {
      const user = await UserRepository.getUserDetails(user_id);

      if (user) {
        const _isValidPassword = await UserRepository.validatePassword({
          email: user.email,
          password: oldPassword,
        });
        if (_isValidPassword) {
          await UserRepository.changePassword({
            email: user.email,
            password: newPassword,
          });

          return {
            success: true,
            message: 'Password updated successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid password',
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async requestEmailChange(user_id: string, email: string) {
    try {
      const user = await UserRepository.getUserDetails(user_id);
      if (user) {
        const token = await UcodeRepository.createToken({
          userId: user.id,
          isOtp: true,
          email: email,
        });

        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: email,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent an OTP code to your email',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async changeEmail({
    user_id,
    new_email,
    token,
  }: {
    user_id: string;
    new_email: string;
    token: string;
  }) {
    try {
      const user = await UserRepository.getUserDetails(user_id);

      if (user) {
        const existToken = await UcodeRepository.validateToken({
          email: new_email,
          token: token,
          forEmailChange: true,
        });

        if (existToken) {
          await UserRepository.changeEmail({
            user_id: user.id,
            new_email: new_email,
          });

          // delete otp code
          await UcodeRepository.deleteToken({
            email: new_email,
            token: token,
          });

          return {
            success: true,
            message: 'Email updated successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
          };
        }
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // --------- 2FA ---------
  async generate2FASecret(user_id: string) {
    try {
      return await UserRepository.generate2FASecret(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async verify2FA(user_id: string, token: string) {
    try {
      const isValid = await UserRepository.verify2FA(user_id, token);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid token',
        };
      }
      return {
        success: true,
        message: '2FA verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async enable2FA(user_id: string) {
    try {
      const user = await UserRepository.getUserDetails(user_id);
      if (user) {
        await UserRepository.enable2FA(user_id);
        return {
          success: true,
          message: '2FA enabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async disable2FA(user_id: string) {
    try {
      const user = await UserRepository.getUserDetails(user_id);
      if (user) {
        await UserRepository.disable2FA(user_id);
        return {
          success: true,
          message: '2FA disabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // --------- end 2FA ---------
}
