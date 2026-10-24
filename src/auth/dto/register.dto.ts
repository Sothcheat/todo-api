import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // Same rule as the frontend form: letters, numbers, dots, dashes, underscores.
  @Matches(/^[\w.-]+$/, {
    message:
      'username may only contain letters, numbers, dots, dashes and underscores',
  })
  @MaxLength(50)
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  // argon2 has no length limit; the cap just stops huge inputs wasting CPU.
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
