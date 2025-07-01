import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFiles,
  Put,
  UseGuards,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express/multer';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from 'src/common/guard/role/role.enum';
import { Roles } from 'src/common/guard/role/roles.decorator';
import { RolesGuard } from 'src/common/guard/role/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';


@Controller('admin/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

 

@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Post()
@UseInterceptors(
  FilesInterceptor('img', 10, {
    storage: memoryStorage(),
  }),
)
async create(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() body: any,
) {
  try {
    const parsedDto = {
      ...body,
      hashtags: Array.isArray(body.hashtags) ? body.hashtags : JSON.parse(body.hashtags || '[]'),
  categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : JSON.parse(body.categoryIds || '[]'),
  contents: Array.isArray(body.contents) ? body.contents : JSON.parse(body.contents || '[]'),
    };

    console.log("Blog created");

    return await this.blogService.create(parsedDto, files);
  } catch (error) {
    console.error('[Create Blog Error]', error);
    throw new InternalServerErrorException(
      error.message || 'Invalid form body or file.',
    );
  }
}


@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Get('/drafts')
async findDrafts() {
  return await this.blogService.findDrafts();
}



@Get()
async findAll() {
    try {
      return await this.blogService.findAll();
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Fetch failed');
    }
}

@Get(':id')
async findOne(@Param('id') id: string) {
    try {
      return await this.blogService.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Not found');
    }
}


@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Patch(':id')
@UseInterceptors(FilesInterceptor('img', 10, { storage: memoryStorage() }))
async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    try {
      const parsedDto: UpdateBlogDto = {
        ...body,
        ...(body.hashtags && {
          hashtags: Array.isArray(body.hashtags)
            ? body.hashtags
            : JSON.parse(body.hashtags),
        }),
        ...(body.categoryIds && {
          categoryIds: Array.isArray(body.categoryIds)
            ? body.categoryIds
            : JSON.parse(body.categoryIds),
        }),
        ...(body.contents && {
          contents: Array.isArray(body.contents)
            ? body.contents
            : JSON.parse(body.contents),
        }),
      };

      return await this.blogService.update(id, parsedDto, files);
    } catch (error) {
      console.error('[❌ Update Blog Error]', error);
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
}

@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Patch(':id/publish')
async publish(@Param('id') id: string) {
  try {
    return await this.blogService.publishPost(id);
  } catch (error) {
    console.error('[❌ Publish Blog Error]', error);
    throw new InternalServerErrorException(error.message || 'Publish failed');
  }
}

@ApiBearerAuth()
@ApiTags('Website Info')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_LITE)
@Delete(':id')
async remove(@Param('id') id: string) {
    try {
      return await this.blogService.remove(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Delete failed');
    }
}
}
