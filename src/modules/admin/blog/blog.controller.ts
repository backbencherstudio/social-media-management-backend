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
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express/multer';
import { memoryStorage } from 'multer';

@Controller('admin/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

 
// @Post()
// @UseInterceptors(
//   FileInterceptor('contents', {
//     storage: memoryStorage(),
//   }),
// )
// async create(
//   @UploadedFile() file: Express.Multer.File,
//   @Body() body: any,
// ) {
//   try {
//     const parsedDto: CreateBlogDto = {
//       ...body,
//       hashtags: JSON.parse(body.hashtags),
//       categoryIds: JSON.parse(body.categoryIds),
//       contents: JSON.parse(body.contents),
//     };

//     return await this.blogService.create(parsedDto, file);
//   } catch (error) {
//     console.error('[❌ Create Blog Error]', error);
//     throw new InternalServerErrorException('Invalid form body or file.');
//   }
// }


@Post()
@UseInterceptors(
  FilesInterceptor('img', 10, { // 'img' is the name of the field, and 10 is the max number of files you can upload
    storage: memoryStorage(),
  }),
)
async create(
  @UploadedFiles() files: Express.Multer.File[], // Multiple files
  @Body() body: any,
) {
  try {
    const parsedDto = {
      ...body,
      hashtags: JSON.parse(body.hashtags),
      categoryIds: JSON.parse(body.categoryIds),
      contents: JSON.parse(body.contents),
    };

    return await this.blogService.create(parsedDto, files);
  } catch (error) {
    console.error('[❌ Create Blog Error]', error);
    throw new InternalServerErrorException('Invalid form body or file.');
  }
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
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    try {
      return await this.blogService.update(id, dto);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Update failed');
    }
  }
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.blogService.remove(id);
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Delete failed');
    }
  }
}
