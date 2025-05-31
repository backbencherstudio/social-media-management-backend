import { float } from 'aws-sdk/clients/cloudfront';
import { int } from 'aws-sdk/clients/datapipeline';
import { IsInt, IsNumber, IsString } from 'class-validator';


export class CreateTaskManagementDto {}

export class AssignUserDto {
  @IsString()
  res_id: string;

  @IsString()
  roleId: string;

  @IsNumber()
  ammount: number;
  
  @IsString()
  note: string;
}


export class UnassignUserDto {
  @IsString()
  res_id: string;
  
  @IsString()
  taskId: string;

  @IsString()
  note: string;
}
