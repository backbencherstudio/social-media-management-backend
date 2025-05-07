import {
  Controller,
  Get,
  Patch,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WebsiteInfoService } from './website-info.service';
import { UpdateWebsiteInfoDto } from './dto/update-website-info.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Role } from 'src/common/guard/role/role.enum';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/website-info')
export class WebsiteInfoController {
  constructor(private readonly websiteInfoService: WebsiteInfoService) {}

  @ApiOperation({ summary: 'Get website info' })
  @Get()
  async getInfo() {
    try {
      const websiteInfo = await this.websiteInfoService.getInfo();
      return { success: true, data: websiteInfo };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @ApiOperation({ summary: 'Update website info' })
  @Patch()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'favicon', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination:
            appConfig().storageUrl.rootUrl + appConfig().storageUrl.websiteInfo,
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${file.originalname}`);
          },
        }),
      },
    ),
  )
  async updateInfo(
    @Req() req: Request,
    @Body() dto: UpdateWebsiteInfoDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
    },
  ) {
    try {
      const result = await this.websiteInfoService.updateInfo(dto, files);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @ApiOperation({ summary: 'Restore default website info' })
  @Patch('restore')
  async restoreDefaults() {
    try {
      const result = await this.websiteInfoService.restoreDefaults();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
