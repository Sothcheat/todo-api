import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Every field is optional so the client can PATCH just what changed.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  // Same rule as the frontend form: letters, numbers, dots, dashes, underscores.
  @IsOptional()
  @Matches(/^[\w.-]+$/, {
    message:
      'username may only contain letters, numbers, dots, dashes and underscores',
  })
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
