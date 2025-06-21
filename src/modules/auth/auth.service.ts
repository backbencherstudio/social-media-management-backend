// external imports
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
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
import { ResellerApplicationDto } from './dto/apply_for_reseller.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) { }

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

  // service part
  async login({ email, password }) { // if need social log-in (need to modefy)
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      const { id: userId } = existingUser;
      // console.log("existingUser: ", existingUser);

      if (!existingUser?.password) {
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
          message: `Please set your account Password. A link sent to email: ${email}`,
          // token: token
        };
      }

      const hashedPassword = existingUser?.password;
      // console.log(hashedPassword);
      const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

      console.log(isPasswordMatch);
      if (!isPasswordMatch) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid credentials',
          },
          HttpStatus.BAD_REQUEST,
        );
      }


      const payload = { email: email, sub: userId };
      const token = this.jwtService.sign(payload);
      const user = await UserRepository.getUserDetails(userId);
      // console.log("Successfully LogIn: ", user);

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

      // console.log('existingUser: ', existingUser);

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
        message: `Registration link sent to email: ${email}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async verifyRegistrationToken(password: string, token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const { email } = decoded;

      console.log('decoded: ', decoded);

      // 🔍 Step 1: Check if the user already exists BEFORE upsert
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      const hashedPassword = await bcrypt.hash(password, appConfig().security.salt);


      const user = await this.prisma.user.upsert({
        where: {
          email,
        },
        update: {
          status: 1,
          password: hashedPassword,  // Save the hashed password
        },
        create: {
          email,
          password: hashedPassword,  // Save the hashed password
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

  // Apply for reseller
  async applyForReseller(data: ResellerApplicationDto, userId: string) {

    try {
      if (!userId) {
        throw new Error('User ID is required to apply for reseller.');
      }

      const existingApplication = await this.prisma.resellerApplication.findFirst({
        where: {
          user_id: userId,
          status: 'pending',
        },
      });


      if (existingApplication) {
        throw new Error('You have already applied for reseller status.');
      }


      const application = await this.prisma.resellerApplication.create({
        data: {
          user_id: userId,
          full_name: data.full_name,
          user_email: data.user_email,
          phone_number: data.phone_number,
          location: data.location,
          position: data.position,
          experience: data.experience,
          cover_letter: data.cover_letter,
          portfolio: data.portfolio,
          skills: data.skills,
          status: 'pending',
        },
      });

      await this.mailService.submitSuccessEmail({
        email: application.user_email,
        name: application.full_name,
      });

      return {
        success: true,
        message: 'Application for reseller successfully submitted.',
        data: application,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error applying for reseller: ${error.message}`,
      };
    }
  }

  // --------- Google Login ---------
  async handleGoogleLogin(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken: string;
    refreshToken: string;
    provider: string;
    id: string;
  }) {
    try {
      // Check for existing user
      let user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
  
      // Create new user if not found
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            avatar: profile.picture,
            name: `${profile.firstName} ${profile.lastName}`,
            email_verified_at: new Date(),
          },
        });
      }
  
      // Upsert into Account table
      await this.prisma.account.upsert({
        where: {
          provider_provider_account_id: {
            provider: profile.provider,
            provider_account_id: profile.id,
          },
        },
        update: {
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        create: {
          provider: profile.provider,
          provider_account_id: profile.id,
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          user_id: user.id,
          type: 'oauth',
        },
      });
  
      // Return JWT token
      return this.login({ email: user.email, password: user.id });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // facebook login
  async handleFacebookLogin(profile: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken: string;
    refreshToken: string;
    provider: string;
    id: string;
  }) {
    try {
      let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            avatar: profile.picture,
          },
        });
      }
  
      await this.prisma.account.upsert({
        where: {
          provider_provider_account_id: {
            provider: 'facebook',
            provider_account_id: profile.id,
          }
        },
        update: {
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
        create: {
          provider: 'facebook',
          provider_account_id: profile.id,
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        }
      });
  
      return this.login({ email: profile.email, password: user.id });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }


  // instagram
  async handleInstagramLogin(profile: {
    username: string;
    id: string;
    accessToken: string;
    refreshToken: string;
    provider: string;
  }) {
    try {
      // Instagram API often does not provide email, so use username or some other unique id
      // Try to find user by username or linked Instagram ID
      let user = await this.prisma.user.findUnique({
        where: { username: profile.username },
      });
  
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            username: profile.username,
            // You can map more fields here if available
            // email might not be provided by Instagram, handle accordingly
            // e.g. email: profile.email ?? null,
            // avatar or profile picture is usually from Instagram API, map if you have it
          },
        });
      }
  
      // Upsert Instagram account
      await this.prisma.account.upsert({
        where: {
          provider_provider_account_id: {
            provider: 'instagram',
            provider_account_id: profile.id,
          },
        },
        update: {
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
        create: {
          provider: 'instagram',
          provider_account_id: profile.id,
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
      });
  
      return this.login({ email: user.email, password: user.id });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // twiter
  async handleTwitterLogin(profile: {
    id: string;
    username: string;
    name: string;
    email?: string;
    avatar?: string;
    accessToken: string;
    refreshToken: string;
    provider: string;
  }) {
    try {
      // 1. Find user by email or username (email might be missing in Twitter)
      let user = await this.prisma.user.findFirst({
        where: { username: profile.username },
      });
  
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            username: profile.username,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
          },
        });
      }
  
      // 2. Upsert account
      await this.prisma.account.upsert({
        where: {
          provider_provider_account_id: {
            provider: 'twitter',
            provider_account_id: profile.id,
          },
        },
        update: {
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
        create: {
          provider: 'twitter',
          provider_account_id: profile.id,
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
      });
  
      // 3. Generate JWT and return
      return this.login({ email: user.email, password: user.id });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async handleLinkedinLogin(profile: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    accessToken: string;
    refreshToken: string;
    provider: string;
  }) {
    try {
      let user = await this.prisma.user.findFirst({
        where: {
          email: profile.email,
        },
      });
  
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            first_name: profile.firstName,
            last_name: profile.lastName,
            avatar: profile.avatar,
          },
        });
      }
  
      await this.prisma.account.upsert({
        where: {
          provider_provider_account_id: {
            provider: 'linkedin',
            provider_account_id: profile.id,
          },
        },
        update: {
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
        create: {
          provider: 'linkedin',
          provider_account_id: profile.id,
          access_token: profile.accessToken,
          refresh_token: profile.refreshToken,
          user_id: user.id,
        },
      });
  
      return this.login({ email: profile.email, password: user.id });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  
  
}
