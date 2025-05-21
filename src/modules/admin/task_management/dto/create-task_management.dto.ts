import { int } from 'aws-sdk/clients/datapipeline';
import { IsInt, IsString } from 'class-validator';


export class CreateTaskManagementDto {}

export class AssignUserDto {
  @IsString()
  userId: string;

  @IsString()
  roleId: string;

  @IsInt()
  ammount: int;
  
  @IsString()
  note: string;
}


export class UnassignUserDto {
  @IsString()
  userId: string;

  @IsString()
  taskId: string;

  @IsString()
  note: string;
}
