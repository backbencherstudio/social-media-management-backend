import { ContentType } from "./create-blog-content.dto";

export class UpdateBlogDto {
  title: string;
  hashtags?: string[];
  categoryIds?: string[];
  contents: {
    contentType: ContentType;
    content: string;
  }[];
}
