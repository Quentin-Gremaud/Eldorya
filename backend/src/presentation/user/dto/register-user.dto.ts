import {
  IsString,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsISO8601,
  Equals,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  clerkUserId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsBoolean()
  @Equals(true, { message: 'Age declaration must be confirmed (must be true)' })
  ageDeclaration: boolean;

  @IsISO8601()
  ageDeclarationTimestamp: string;

  @IsISO8601()
  createdAt: string;
}
