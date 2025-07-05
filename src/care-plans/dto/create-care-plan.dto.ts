import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateCarePlanDto {
  @IsString()
  @IsNotEmpty()
  readonly planName: string;

  @IsString()
  @IsNotEmpty()
  readonly description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  readonly monthlyPrice: number;

  @IsString()
  @IsNotEmpty()
  readonly planType: string;

  @IsString()
  @IsNotEmpty()
  readonly category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly servicesIncluded: string[];

  @IsString()
  @IsNotEmpty()
  readonly staffRatio: string;

  @IsString()
  @IsNotEmpty()
  readonly durationType: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly defaultMedications: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly prerequisites: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly contraindications: string[];

  @IsBoolean()
  @IsOptional()
  readonly isActive: boolean;
} 